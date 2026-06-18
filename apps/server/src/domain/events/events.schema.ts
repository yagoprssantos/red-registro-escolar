import { z } from "zod";

export const createEventInput = z.object({
  schoolId: z.number().int().positive(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional().nullable(),
  eventType: z
    .enum(["prova", "feriado", "saida_antecipada", "evento_escolar", "reuniao"])
    .default("evento_escolar"),
  startsAt: z.string(),
  endsAt: z.string().optional().nullable(),
  targetConfig: z.enum(["all", "class", "grade"]).default("all"),
  targetRefId: z.number().int().positive().optional(),
});

export type CreateEventInput = z.infer<typeof createEventInput>;
