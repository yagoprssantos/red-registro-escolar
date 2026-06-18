import { z } from "zod";

export const justifyAbsenceInput = z.object({
  attendanceRecordId: z.number().int().positive(),
  reason: z.string().min(10, "O motivo deve ter pelo menos 10 caracteres"),
  attachmentUrl: z.string().url().optional().nullable(),
});

export const reviewJustificationInput = z.object({
  justificationId: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().optional().nullable(),
});

export type JustifyAbsenceInput = z.infer<typeof justifyAbsenceInput>;
export type ReviewJustificationInput = z.infer<typeof reviewJustificationInput>;
