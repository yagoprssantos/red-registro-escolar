import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./core/trpc";
import {
  createEntityRow,
  deleteEntityRow,
  getEntityById,
  getUserManagedSchoolIds,
  listEntityRows,
  listNotificationsForUser,
  markAllNotificationsAsReadForUser,
  markNotificationAsReadForUser,
  RegistryEntityName,
  resolveEntitySchoolId,
  updateEntityRow,
  userHasSchoolAccess,
  validateAttachmentOwner,
} from "./db";

const registryEntities = [
  "users",
  "schools",
  "schoolYears",
  "userSchools",
  "schoolStaffProfiles",
  "teachers",
  "students",
  "guardians",
  "studentGuardians",
  "contacts",
  "subjects",
  "classes",
  "classSubjects",
  "classTeachers",
  "classEnrollments",
  "classSessions",
  "attendanceRecords",
  "assessments",
  "assessmentScores",
  "studentComments",
  "schoolEvents",
  "eventTargets",
  "communications",
  "communicationRecipients",
  "notifications",
  "attachments",
] as const;

const entitySchema = z.enum(registryEntities);
const dataSchema = z.record(z.string(), z.unknown());
const filtersSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ])
);

const listInputSchema = z.object({
  entity: entitySchema,
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
  orderBy: z.string().min(1).optional(),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
  filters: filtersSchema.optional(),
});

const idInputSchema = z.object({
  entity: entitySchema,
  id: z.number().int().positive(),
});

const createInputSchema = z.object({
  entity: entitySchema,
  data: dataSchema,
});

const updateInputSchema = z.object({
  entity: entitySchema,
  id: z.number().int().positive(),
  data: dataSchema,
});

const deleteInputSchema = z.object({
  entity: entitySchema,
  id: z.number().int().positive(),
});

type AccessUser = {
  id: number;
  role: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payload inválido para esta operação",
    });
  }

  return value as Record<string, unknown>;
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }

  return null;
}

function ensureStringUnion<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string
): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Campo ${field} inválido`,
    });
  }

  return value as T[number];
}

async function getRequiredRow(
  entity: RegistryEntityName,
  id: number,
  label: string
): Promise<Record<string, unknown>> {
  const row = await getEntityById(entity, id);
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${label} não encontrado(a)`,
    });
  }

  return asRecord(row);
}

async function getEntitySchoolIdOrThrow(
  entity: RegistryEntityName,
  id: number,
  label: string
): Promise<number> {
  const row = await getRequiredRow(entity, id, label);
  const schoolId = await resolveEntitySchoolId(entity, row);

  if (!schoolId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Não foi possível determinar a escola para ${label}`,
    });
  }

  return schoolId;
}

function assertSameSchool(
  baseSchoolId: number,
  candidateSchoolId: number,
  what: string
) {
  if (baseSchoolId !== candidateSchoolId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${what} precisa pertencer à mesma escola`,
    });
  }
}

async function assertSchoolAccess(user: AccessUser, schoolId: number) {
  if (user.role === "admin") return;

  const hasAccess = await userHasSchoolAccess(user.id, schoolId);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem acesso a esta escola",
    });
  }
}

async function assertRowAccess(
  user: AccessUser,
  entity: RegistryEntityName,
  row: Record<string, unknown>
) {
  if (user.role === "admin") return;

  if (entity === "users") {
    if (toInt(row.id) !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você só pode acessar seu próprio usuário",
      });
    }
    return;
  }

  if (entity === "notifications") {
    if (toInt(row.userId) !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você só pode acessar suas notificações",
      });
    }
    return;
  }

  const schoolId = await resolveEntitySchoolId(entity, row);
  if (!schoolId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Recurso sem escopo de escola para seu usuário",
    });
  }

  await assertSchoolAccess(user, schoolId);
}

async function validatePayloadAndResolveSchool(
  entity: RegistryEntityName,
  payload: Record<string, unknown>
): Promise<number | null> {
  const requireId = (field: string, message?: string) => {
    const id = toInt(payload[field]);
    if (!id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: message ?? `Campo ${field} é obrigatório`,
      });
    }
    return id;
  };

  const optionalId = (field: string) => toInt(payload[field]);

  switch (entity) {
    case "users":
    case "schools":
      return null;

    case "contacts": {
      const schoolId = optionalId("schoolId");
      if (schoolId) {
        await getRequiredRow("schools", schoolId, "Escola");
      }
      return schoolId;
    }

    case "schoolYears": {
      const schoolId = requireId("schoolId");
      await getRequiredRow("schools", schoolId, "Escola");
      return schoolId;
    }

    case "userSchools": {
      const schoolId = requireId("schoolId");
      const userId = requireId("userId");
      await getRequiredRow("schools", schoolId, "Escola");
      await getRequiredRow("users", userId, "Usuário");
      return schoolId;
    }

    case "schoolStaffProfiles": {
      const schoolId = requireId("schoolId");
      const userId = requireId("userId");
      await getRequiredRow("schools", schoolId, "Escola");
      await getRequiredRow("users", userId, "Usuário");
      return schoolId;
    }

    case "teachers": {
      const schoolId = requireId("schoolId");
      const userId = requireId("userId");
      await getRequiredRow("schools", schoolId, "Escola");
      await getRequiredRow("users", userId, "Usuário");
      return schoolId;
    }

    case "students": {
      const schoolId = requireId("schoolId");
      await getRequiredRow("schools", schoolId, "Escola");
      const userId = optionalId("userId");
      if (userId) {
        await getRequiredRow("users", userId, "Usuário");
      }
      return schoolId;
    }

    case "guardians": {
      const schoolId = requireId("schoolId");
      await getRequiredRow("schools", schoolId, "Escola");
      const userId = optionalId("userId");
      if (userId) {
        await getRequiredRow("users", userId, "Usuário");
      }
      return schoolId;
    }

    case "studentGuardians": {
      const studentId = requireId("studentId");
      const guardianId = requireId("guardianId");
      const studentSchoolId = await getEntitySchoolIdOrThrow(
        "students",
        studentId,
        "Aluno"
      );
      const guardianSchoolId = await getEntitySchoolIdOrThrow(
        "guardians",
        guardianId,
        "Responsável"
      );
      assertSameSchool(
        studentSchoolId,
        guardianSchoolId,
        "Aluno e responsável"
      );
      return studentSchoolId;
    }

    case "subjects": {
      const schoolId = requireId("schoolId");
      await getRequiredRow("schools", schoolId, "Escola");
      return schoolId;
    }

    case "classes": {
      const schoolId = requireId("schoolId");
      const schoolYearId = requireId("schoolYearId");
      await getRequiredRow("schools", schoolId, "Escola");
      const schoolYearSchoolId = await getEntitySchoolIdOrThrow(
        "schoolYears",
        schoolYearId,
        "Ano letivo"
      );
      assertSameSchool(schoolId, schoolYearSchoolId, "Turma e ano letivo");
      return schoolId;
    }

    case "classSubjects": {
      const classId = requireId("classId");
      const subjectId = requireId("subjectId");
      const classSchoolId = await getEntitySchoolIdOrThrow(
        "classes",
        classId,
        "Turma"
      );
      const subjectSchoolId = await getEntitySchoolIdOrThrow(
        "subjects",
        subjectId,
        "Disciplina"
      );
      assertSameSchool(classSchoolId, subjectSchoolId, "Turma e disciplina");
      return classSchoolId;
    }

    case "classTeachers": {
      const classSubjectId = requireId("classSubjectId");
      const teacherId = requireId("teacherId");
      const classSubjectSchoolId = await getEntitySchoolIdOrThrow(
        "classSubjects",
        classSubjectId,
        "Vínculo turma-disciplina"
      );
      const teacherSchoolId = await getEntitySchoolIdOrThrow(
        "teachers",
        teacherId,
        "Professor"
      );
      assertSameSchool(
        classSubjectSchoolId,
        teacherSchoolId,
        "Professor e turma-disciplina"
      );
      return classSubjectSchoolId;
    }

    case "classEnrollments": {
      const classId = requireId("classId");
      const studentId = requireId("studentId");
      const classSchoolId = await getEntitySchoolIdOrThrow(
        "classes",
        classId,
        "Turma"
      );
      const studentSchoolId = await getEntitySchoolIdOrThrow(
        "students",
        studentId,
        "Aluno"
      );
      assertSameSchool(classSchoolId, studentSchoolId, "Turma e aluno");
      return classSchoolId;
    }

    case "classSessions": {
      const classSubjectId = requireId("classSubjectId");
      const classSubjectSchoolId = await getEntitySchoolIdOrThrow(
        "classSubjects",
        classSubjectId,
        "Vínculo turma-disciplina"
      );
      const teacherId = optionalId("teacherId");
      if (teacherId) {
        const teacherSchoolId = await getEntitySchoolIdOrThrow(
          "teachers",
          teacherId,
          "Professor"
        );
        assertSameSchool(
          classSubjectSchoolId,
          teacherSchoolId,
          "Sessão e professor"
        );
      }
      return classSubjectSchoolId;
    }

    case "attendanceRecords": {
      const classSessionId = requireId("classSessionId");
      const studentId = requireId("studentId");
      const sessionSchoolId = await getEntitySchoolIdOrThrow(
        "classSessions",
        classSessionId,
        "Sessão de aula"
      );
      const studentSchoolId = await getEntitySchoolIdOrThrow(
        "students",
        studentId,
        "Aluno"
      );
      assertSameSchool(sessionSchoolId, studentSchoolId, "Sessão e aluno");

      const recordedByTeacherId = optionalId("recordedByTeacherId");
      if (recordedByTeacherId) {
        const teacherSchoolId = await getEntitySchoolIdOrThrow(
          "teachers",
          recordedByTeacherId,
          "Professor responsável"
        );
        assertSameSchool(
          sessionSchoolId,
          teacherSchoolId,
          "Sessão e professor"
        );
      }

      return sessionSchoolId;
    }

    case "assessments": {
      const classSubjectId = requireId("classSubjectId");
      const classSubjectSchoolId = await getEntitySchoolIdOrThrow(
        "classSubjects",
        classSubjectId,
        "Vínculo turma-disciplina"
      );

      const teacherId = optionalId("teacherId");
      if (teacherId) {
        const teacherSchoolId = await getEntitySchoolIdOrThrow(
          "teachers",
          teacherId,
          "Professor"
        );
        assertSameSchool(
          classSubjectSchoolId,
          teacherSchoolId,
          "Avaliação e professor"
        );
      }

      return classSubjectSchoolId;
    }

    case "assessmentScores": {
      const assessmentId = requireId("assessmentId");
      const studentId = requireId("studentId");
      const assessmentSchoolId = await getEntitySchoolIdOrThrow(
        "assessments",
        assessmentId,
        "Avaliação"
      );
      const studentSchoolId = await getEntitySchoolIdOrThrow(
        "students",
        studentId,
        "Aluno"
      );
      assertSameSchool(
        assessmentSchoolId,
        studentSchoolId,
        "Avaliação e aluno"
      );
      return assessmentSchoolId;
    }

    case "studentComments": {
      const schoolId = requireId("schoolId");
      const studentId = requireId("studentId");
      await getRequiredRow("schools", schoolId, "Escola");
      const studentSchoolId = await getEntitySchoolIdOrThrow(
        "students",
        studentId,
        "Aluno"
      );
      assertSameSchool(schoolId, studentSchoolId, "Comentário e aluno");

      const teacherId = optionalId("teacherId");
      if (teacherId) {
        const teacherSchoolId = await getEntitySchoolIdOrThrow(
          "teachers",
          teacherId,
          "Professor"
        );
        assertSameSchool(schoolId, teacherSchoolId, "Comentário e professor");
      }

      const classSubjectId = optionalId("classSubjectId");
      if (classSubjectId) {
        const classSubjectSchoolId = await getEntitySchoolIdOrThrow(
          "classSubjects",
          classSubjectId,
          "Vínculo turma-disciplina"
        );
        assertSameSchool(
          schoolId,
          classSubjectSchoolId,
          "Comentário e turma-disciplina"
        );
      }

      return schoolId;
    }

    case "schoolEvents": {
      const schoolId = requireId("schoolId");
      await getRequiredRow("schools", schoolId, "Escola");
      const createdByUserId = optionalId("createdByUserId");
      if (createdByUserId) {
        await getRequiredRow("users", createdByUserId, "Usuário criador");
      }
      return schoolId;
    }

    case "eventTargets": {
      const eventId = requireId("eventId");
      const targetRefId = requireId("targetRefId");
      const targetType = ensureStringUnion(
        payload.targetType,
        ["school", "class", "student", "guardian"] as const,
        "targetType"
      );

      const eventSchoolId = await getEntitySchoolIdOrThrow(
        "schoolEvents",
        eventId,
        "Evento"
      );

      if (targetType === "school") {
        const school = await getRequiredRow(
          "schools",
          targetRefId,
          "Escola destino"
        );
        const schoolId = toInt(school.id)!;
        assertSameSchool(eventSchoolId, schoolId, "Evento e destino da escola");
      }

      if (targetType === "class") {
        const classSchoolId = await getEntitySchoolIdOrThrow(
          "classes",
          targetRefId,
          "Turma destino"
        );
        assertSameSchool(
          eventSchoolId,
          classSchoolId,
          "Evento e turma destino"
        );
      }

      if (targetType === "student") {
        const studentSchoolId = await getEntitySchoolIdOrThrow(
          "students",
          targetRefId,
          "Aluno destino"
        );
        assertSameSchool(
          eventSchoolId,
          studentSchoolId,
          "Evento e aluno destino"
        );
      }

      if (targetType === "guardian") {
        const guardianSchoolId = await getEntitySchoolIdOrThrow(
          "guardians",
          targetRefId,
          "Responsável destino"
        );
        assertSameSchool(
          eventSchoolId,
          guardianSchoolId,
          "Evento e responsável destino"
        );
      }

      return eventSchoolId;
    }

    case "communications": {
      const schoolId = requireId("schoolId");
      await getRequiredRow("schools", schoolId, "Escola");

      const authorUserId = optionalId("authorUserId");
      if (authorUserId) {
        await getRequiredRow("users", authorUserId, "Autor");
      }

      const relatedEventId = optionalId("relatedEventId");
      if (relatedEventId) {
        const eventSchoolId = await getEntitySchoolIdOrThrow(
          "schoolEvents",
          relatedEventId,
          "Evento relacionado"
        );
        assertSameSchool(
          schoolId,
          eventSchoolId,
          "Comunicado e evento relacionado"
        );
      }

      return schoolId;
    }

    case "communicationRecipients": {
      const communicationId = requireId("communicationId");
      const recipientRefId = requireId("recipientRefId");
      const recipientType = ensureStringUnion(
        payload.recipientType,
        ["student", "guardian", "teacher", "staff"] as const,
        "recipientType"
      );

      const communicationSchoolId = await getEntitySchoolIdOrThrow(
        "communications",
        communicationId,
        "Comunicado"
      );

      if (recipientType === "student") {
        const schoolId = await getEntitySchoolIdOrThrow(
          "students",
          recipientRefId,
          "Aluno"
        );
        assertSameSchool(communicationSchoolId, schoolId, "Comunicado e aluno");
      }

      if (recipientType === "guardian") {
        const schoolId = await getEntitySchoolIdOrThrow(
          "guardians",
          recipientRefId,
          "Responsável"
        );
        assertSameSchool(
          communicationSchoolId,
          schoolId,
          "Comunicado e responsável"
        );
      }

      if (recipientType === "teacher") {
        const schoolId = await getEntitySchoolIdOrThrow(
          "teachers",
          recipientRefId,
          "Professor"
        );
        assertSameSchool(
          communicationSchoolId,
          schoolId,
          "Comunicado e professor"
        );
      }

      if (recipientType === "staff") {
        const schoolId = await getEntitySchoolIdOrThrow(
          "schoolStaffProfiles",
          recipientRefId,
          "Equipe escolar"
        );
        assertSameSchool(
          communicationSchoolId,
          schoolId,
          "Comunicado e equipe"
        );
      }

      return communicationSchoolId;
    }

    case "notifications": {
      const userId = requireId("userId");
      await getRequiredRow("users", userId, "Usuário");
      return null;
    }

    case "attachments": {
      const ownerType = ensureStringUnion(
        payload.ownerType,
        ["event", "communication", "comment"] as const,
        "ownerType"
      );
      const ownerId = requireId("ownerId");

      const ownerExists = await validateAttachmentOwner(ownerType, ownerId);
      if (!ownerExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dono do anexo não encontrado",
        });
      }

      if (ownerType === "event") {
        return await getEntitySchoolIdOrThrow(
          "schoolEvents",
          ownerId,
          "Evento dono"
        );
      }

      if (ownerType === "communication") {
        return await getEntitySchoolIdOrThrow(
          "communications",
          ownerId,
          "Comunicado dono"
        );
      }

      return await getEntitySchoolIdOrThrow(
        "studentComments",
        ownerId,
        "Comentário dono"
      );
    }

    default: {
      const exhaustive: never = entity;
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Entidade não suportada: ${String(exhaustive)}`,
      });
    }
  }
}

export const registryRouter = router({
  meta: router({
    entities: protectedProcedure.query(() => registryEntities),
  }),

  list: protectedProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;

      const rows = await listEntityRows(input.entity, {
        limit: input.limit,
        offset: input.offset,
        filters: input.filters,
        orderBy: input.orderBy,
        orderDirection: input.orderDirection,
      });

      if (user.role === "admin") {
        return rows;
      }

      if (input.entity === "users") {
        return rows.filter(
          (row: unknown) => toInt(asRecord(row).id) === user.id
        );
      }

      if (input.entity === "notifications") {
        return rows.filter(
          (row: unknown) => toInt(asRecord(row).userId) === user.id
        );
      }

      const managedSchoolIds = new Set(await getUserManagedSchoolIds(user.id));
      const filtered: unknown[] = [];

      for (const row of rows) {
        const rowRecord = asRecord(row);
        const schoolId = await resolveEntitySchoolId(input.entity, rowRecord);
        if (schoolId && managedSchoolIds.has(schoolId)) {
          filtered.push(row);
        }
      }

      return filtered;
    }),

  byId: protectedProcedure
    .input(idInputSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      const row = await getEntityById(input.entity, input.id);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registro não encontrado",
        });
      }

      await assertRowAccess(user, input.entity, asRecord(row));
      return row;
    }),

  create: protectedProcedure
    .input(createInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      const payload = asRecord(input.data);

      if (input.entity === "users" && user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar usuários",
        });
      }

      const schoolId = await validatePayloadAndResolveSchool(
        input.entity,
        payload
      );

      if (input.entity === "notifications" && user.role !== "admin") {
        const targetUserId = toInt(payload.userId);
        if (!targetUserId || targetUserId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você só pode criar notificações para sua própria conta",
          });
        }
      }

      if (schoolId) {
        await assertSchoolAccess(user, schoolId);
      }

      const created = await createEntityRow(input.entity, payload);
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao criar registro",
        });
      }

      const createdRecord = asRecord(created);
      if (
        schoolId ||
        input.entity === "notifications" ||
        input.entity === "users"
      ) {
        await assertRowAccess(user, input.entity, createdRecord);
      }

      return created;
    }),

  update: protectedProcedure
    .input(updateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;

      const current = await getEntityById(input.entity, input.id);
      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registro não encontrado",
        });
      }

      const currentRecord = asRecord(current);
      await assertRowAccess(user, input.entity, currentRecord);

      const merged = {
        ...currentRecord,
        ...asRecord(input.data),
      };

      if (input.entity === "users" && user.role !== "admin") {
        const targetId = toInt(merged.id);
        if (targetId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você só pode atualizar seu próprio usuário",
          });
        }
      }

      if (input.entity === "notifications" && user.role !== "admin") {
        const targetUserId = toInt(merged.userId);
        if (targetUserId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você só pode atualizar suas notificações",
          });
        }
      }

      const schoolId = await validatePayloadAndResolveSchool(
        input.entity,
        merged
      );
      if (schoolId) {
        await assertSchoolAccess(user, schoolId);
      }

      const updated = await updateEntityRow(
        input.entity,
        input.id,
        asRecord(input.data)
      );
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao atualizar registro",
        });
      }

      await assertRowAccess(user, input.entity, asRecord(updated));
      return updated;
    }),

  remove: protectedProcedure
    .input(deleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;

      const current = await getEntityById(input.entity, input.id);
      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registro não encontrado",
        });
      }

      await assertRowAccess(user, input.entity, asRecord(current));

      const removed = await deleteEntityRow(input.entity, input.id);
      if (!removed) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao remover registro",
        });
      }

      return {
        success: true,
        removed,
      };
    }),

  notifications: router({
    mine: protectedProcedure
      .input(
        z.object({
          unreadOnly: z.boolean().default(false),
          limit: z.number().int().min(1).max(500).default(100),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await listNotificationsForUser(ctx.user!.id, {
          unreadOnly: input.unreadOnly,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    markRead: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await markNotificationAsReadForUser(
          input.id,
          ctx.user!.id
        );
        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notificação não encontrada para este usuário",
          });
        }

        return updated;
      }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      return await markAllNotificationsAsReadForUser(ctx.user!.id);
    }),
  }),
});

export type RegistryRouter = typeof registryRouter;
