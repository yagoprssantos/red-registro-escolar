import { z } from "zod";

export const createCommunicationInput = z.object({
  schoolId: z.number().int().positive(),
  title: z.string().min(1, "Título é obrigatório"),
  body: z.string().min(1, "Corpo é obrigatório"),
  communicationType: z
    .enum(["announcement", "reminder", "alert"])
    .default("announcement"),
  targetConfig: z
    .enum(["all", "guardians_only", "teachers_only"])
    .default("all"),
  classId: z.number().int().positive().optional(),
  relatedEventId: z.number().int().positive().optional(),
});

export const markReadInput = z.object({
  communicationId: z.number().int().positive(),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationInput>;
