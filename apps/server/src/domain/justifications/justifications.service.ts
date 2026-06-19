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

    return await listEntityRows("absenceJustifications", {
      filters,
      limit: 100,
      orderBy: "createdAt",
      orderDirection: "desc",
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
