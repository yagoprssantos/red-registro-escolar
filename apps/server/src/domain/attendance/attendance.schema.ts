import { z } from "zod";

export const createAttendanceRecordSchema = z.object({
  classSessionId: z.number(),
  studentId: z.number(),
  status: z.enum(["present", "absent", "justified"]),
  reason: z.string().optional().nullable(),
});

export type CreateAttendanceRecordInput = z.infer<
  typeof createAttendanceRecordSchema
>;
