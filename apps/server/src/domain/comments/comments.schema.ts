import { z } from "zod";

export const createCommentSchema = z.object({
  studentId: z.number(),
  category: z.enum(["elogio", "melhoria", "ocorrencia", "comentario"]),
  visibility: z.enum(["student", "guardian", "school", "all"]).default("all"),
  content: z.string().min(1).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
