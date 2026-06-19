import { TRPCError } from "@trpc/server";
import {
  createEntityRow,
  getEntityById,
  getGuardianProfile,
  listEntityRows,
  updateEntityRow,
} from "../../db";

export class JustificationsService {
  static async justifyAbsence(
    guardianUserId: number,
    input: {
      attendanceRecordId: number;
      reason: string;
      attachmentUrl?: string | null;
    }
  ) {
    // Get guardian profile
    const guardian = await getGuardianProfile(guardianUserId);
    if (!guardian) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Perfil de responsável não encontrado",
      });
    }
    const guardianId = (guardian as Record<string, unknown>).id as number;
    const schoolId = (guardian as Record<string, unknown>).schoolId as number;

    // Get attendance record
    const attendanceRecord = await getEntityById(
      "attendanceRecords",
      input.attendanceRecordId
    );
    if (!attendanceRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Registro de frequência não encontrado",
      });
    }

    const record = attendanceRecord as Record<string, unknown>;
    if (record.status !== "absent") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Só é possível justificar faltas",
      });
    }

    // Verify guardian is linked to this student
    const studentId = record.studentId as number;
    const studentGuardians = await listEntityRows("studentGuardians", {
      filters: { studentId },
    });
    const isLinked = studentGuardians.some(
      (sg: Record<string, unknown>) => (sg.guardianId as number) === guardianId
    );
    if (!isLinked) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Responsável não está vinculado a este aluno",
      });
    }

    // Check for existing pending/approved justification
    const existing = await listEntityRows("absenceJustifications", {
      filters: { attendanceRecordId: input.attendanceRecordId },
    });
    const hasActive = existing.some(
      (j: Record<string, unknown>) =>
        (j.status as string) === "pending" ||
        (j.status as string) === "approved"
    );
    if (hasActive) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Já existe uma justificativa para esta falta",
      });
    }

    // Create justification
    const justification = await createEntityRow("absenceJustifications", {
      attendanceRecordId: input.attendanceRecordId,
      guardianId,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl || null,
      status: "pending",
      schoolId,
    });

    return justification;
  }

  static async listMyJustifications(guardianUserId: number) {
    const guardian = await getGuardianProfile(guardianUserId);
    if (!guardian) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Perfil de responsável não encontrado",
      });
    }
    const guardianId = (guardian as Record<string, unknown>).id as number;

    return await listEntityRows("absenceJustifications", {
      filters: { guardianId },
      limit: 100,
      orderBy: "createdAt",
      orderDirection: "desc",
    });
  }

  static async listBySchool(schoolId: number, status?: string) {
    const filters: Record<string, string | number | boolean | null | undefined> = { schoolId };
    if (status) filters.status = status;

    const justifications = await listEntityRows("absenceJustifications", {
      filters,
      limit: 100,
      orderBy: "createdAt",
      orderDirection: "desc",
    });

    if (justifications.length === 0) return [];

    // Collect IDs for batch fetching
    const guardianIds = [...new Set(justifications.map(j => (j as Record<string, unknown>).guardianId as number).filter(Boolean))];
    const arIds = [...new Set(justifications.map(j => (j as Record<string, unknown>).attendanceRecordId as number).filter(Boolean))];

    const [guardians, attendanceRecords] = await Promise.all([
      guardianIds.length > 0 ? listEntityRows("guardians", { filters: { id: guardianIds }, limit: guardianIds.length }) : [],
      arIds.length > 0 ? listEntityRows("attendanceRecords", { filters: { id: arIds }, limit: arIds.length }) : [],
    ]);

    const studentIds = [...new Set(attendanceRecords.map(ar => (ar as Record<string, unknown>).studentId as number).filter(Boolean))];
    const sessionIds = [...new Set(attendanceRecords.map(ar => (ar as Record<string, unknown>).classSessionId as number).filter(Boolean))];

    const [students, sessions] = await Promise.all([
      studentIds.length > 0 ? listEntityRows("students", { filters: { id: studentIds }, limit: studentIds.length }) : [],
      sessionIds.length > 0 ? listEntityRows("classSessions", { filters: { id: sessionIds }, limit: sessionIds.length }) : [],
    ]);

    const teacherIds = [...new Set(sessions.map(s => (s as Record<string, unknown>).teacherId as number).filter(Boolean))];
    const csIds = [...new Set(sessions.map(s => (s as Record<string, unknown>).classSubjectId as number).filter(Boolean))];

    const [teachers, classSubjects] = await Promise.all([
      teacherIds.length > 0 ? listEntityRows("teachers", { filters: { id: teacherIds }, limit: teacherIds.length }) : [],
      csIds.length > 0 ? listEntityRows("classSubjects", { filters: { id: csIds }, limit: csIds.length }) : [],
    ]);

    const classIds = [...new Set(classSubjects.map(cs => (cs as Record<string, unknown>).classId as number).filter(Boolean))];
    const classes = classIds.length > 0 ? await listEntityRows("classes", { filters: { id: classIds }, limit: classIds.length }) : [];

    // Build lookup maps
    type Row = Record<string, unknown>;
    const guardianMap = new Map(guardians.map(g => [(g as Row).id, g as Row]));
    const arMap = new Map(attendanceRecords.map(ar => [(ar as Row).id, ar as Row]));
    const studentMap = new Map(students.map(s => [(s as Row).id, s as Row]));
    const sessionMap = new Map(sessions.map(s => [(s as Row).id, s as Row]));
    const teacherMap = new Map(teachers.map(t => [(t as Row).id, t as Row]));
    const csMap = new Map(classSubjects.map(cs => [(cs as Row).id, cs as Row]));
    const classMap = new Map(classes.map(c => [(c as Row).id, c as Row]));

    return justifications.map(j => {
      const jj = j as Row;
      const guardian = guardianMap.get(jj.guardianId as number);
      const ar = arMap.get(jj.attendanceRecordId as number);
      const student = ar ? studentMap.get(ar.studentId as number) : undefined;
      const session = ar ? sessionMap.get(ar.classSessionId as number) : undefined;
      const teacher = session ? teacherMap.get(session.teacherId as number) : undefined;
      const cs = session ? csMap.get(session.classSubjectId as number) : undefined;
      const cls = cs ? classMap.get(cs.classId as number) : undefined;

      return {
        ...jj,
        guardianName: guardian?.name ?? null,
        studentName: student?.name ?? null,
        lessonDate: session?.lessonDate ?? null,
        teacherName: teacher?.name ?? null,
        subjectName: cs?.subjectName ?? cs?.name ?? null,
        className: cls ? `${cls.gradeLabel ? `${cls.gradeLabel} — ` : ""}${cls.name}` : null,
      };
    });
  }

  static async reviewJustification(
    reviewerUserId: number,
    input: {
      justificationId: number;
      status: "approved" | "rejected";
      reviewNotes?: string | null;
    }
  ) {
    const justification = await getEntityById(
      "absenceJustifications",
      input.justificationId
    );
    if (!justification) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Justificativa não encontrada",
      });
    }

    const j = justification as Record<string, unknown>;
    if ((j.status as string) !== "pending") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Justificativa já foi revisada",
      });
    }

    // Update justification
    const updated = await updateEntityRow(
      "absenceJustifications",
      input.justificationId,
      {
        status: input.status,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date().toISOString(),
        reviewNotes: input.reviewNotes || null,
      }
    );

    // If approved, update attendance record to justified
    if (input.status === "approved") {
      const attendanceRecordId = j.attendanceRecordId as number;
      await updateEntityRow("attendanceRecords", attendanceRecordId, {
        status: "justified",
        reason: `Justificativa aprovada: ${input.reviewNotes || "Sem observações"}`,
      });
    }

    return updated;
  }

  static async getById(justificationId: number) {
    return await getEntityById("absenceJustifications", justificationId);
  }
}
