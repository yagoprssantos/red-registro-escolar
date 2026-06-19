import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import {
  justifyAbsenceInput,
  reviewJustificationInput,
} from "./justifications.schema";
import { JustificationsService } from "./justifications.service";

export const justificationsRouter = router({
  // Guardian: create justification
  create: protectedProcedure
    .input(justifyAbsenceInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const justification = await JustificationsService.justifyAbsence(
        ctx.user.id,
        input
      );

      // Trigger notification to school/teacher
      try {
        const { NotificationService } = await import(
          "../notifications/notification.service"
        );
        const { listEntityRows, getEntityById } = await import("../../db");
        const j = justification as Record<string, unknown>;
        const guardian = await getEntityById(
          "guardians",
          j.guardianId as number
        );
        const attendanceRecord = await getEntityById(
          "attendanceRecords",
          j.attendanceRecordId as number
        );
        if (attendanceRecord && guardian) {
          const ar = attendanceRecord as Record<string, unknown>;
          const student = await getEntityById(
            "students",
            ar.studentId as number
          );
          // Notify school staff about pending justification
          const schoolStaff = await listEntityRows("schoolStaffProfiles", {
            filters: { schoolId: j.schoolId as number },
          });
          const { createNotification } = await import("../../db");
          for (const staff of schoolStaff) {
            const s = staff as Record<string, unknown>;
            if (s.userId) {
              await createNotification({
                userId: s.userId as number,
                notificationType: "justification_pending",
                title: "Justificativa pendente",
                body: `${(student as Record<string, unknown>)?.name || "Aluno"} — Nova justificativa de falta aguardando revisão`,
                actionUrl: "/dashboard/justificativas",
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to create justification notifications:", error);
      }

      return { success: true, justification };
    }),

  // Guardian: list own justifications
  listMine: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }
    return await JustificationsService.listMyJustifications(ctx.user.id);
  }),

  // School: list justifications by school
  listBySchool: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }
      return await JustificationsService.listBySchool(
        input.schoolId,
        input.status
      );
    }),

  // School: review (approve/reject) justification
  review: protectedProcedure
    .input(reviewJustificationInput)
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }

      const result = await JustificationsService.reviewJustification(
        ctx.user.id,
        input
      );

      // Notify guardian about result
      try {
        const { NotificationService } = await import(
          "../notifications/notification.service"
        );
        const { getEntityById } = await import("../../db");
        const j = (await getEntityById(
          "absenceJustifications",
          input.justificationId
        )) as Record<string, unknown>;
        if (j) {
          await NotificationService.notifyJustificationResult(
            j.guardianId as number,
            input.status,
            input.reviewNotes || undefined
          );
        }
      } catch (error) {
        console.error(
          "Failed to create justification result notification:",
          error
        );
      }

      return { success: true, justification: result };
    }),

  // Student: notify guardian to submit justification
  notifyGuardian: protectedProcedure
    .input(z.object({ attendanceRecordId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      try {
        const { getEntityById, listEntityRows, createNotification } = await import("../../db");

        const record = await getEntityById("attendanceRecords", input.attendanceRecordId);
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });

        const r = record as Record<string, unknown>;
        const studentId = r.studentId as number;
        const student = await getEntityById("students", studentId);
        const studentName = (student as Record<string, unknown>)?.name ?? "Aluno";

        const session = await getEntityById("classSessions", r.classSessionId as number);
        const sessionDate = session ? String((session as Record<string, unknown>).lessonDate ?? "") : "";
        const dateStr = sessionDate
          ? new Date(sessionDate + "T12:00:00").toLocaleDateString("pt-BR")
          : "";

        const links = await listEntityRows("studentGuardians", { filters: { studentId }, limit: 10 });
        let notified = 0;
        for (const link of links) {
          const l = link as Record<string, unknown>;
          const guardian = await getEntityById("guardians", l.guardianId as number);
          if (guardian) {
            const g = guardian as Record<string, unknown>;
            if (g.userId) {
              await createNotification({
                userId: g.userId as number,
                notificationType: "absence_alert",
                title: "Solicitação de justificativa de falta",
                body: `${studentName} solicita que você justifique uma falta${dateStr ? ` do dia ${dateStr}` : ""}. Acesse Frequência no portal do responsável para enviar a justificativa.`,
                actionUrl: "/dashboard/frequencia",
              });
              notified++;
            }
          }
        }
        return { success: true, notified };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao notificar responsável" });
      }
    }),

  // Get justification by ID
  byId: protectedProcedure
    .input(z.object({ justificationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }
      return await JustificationsService.getById(input.justificationId);
    }),
});
