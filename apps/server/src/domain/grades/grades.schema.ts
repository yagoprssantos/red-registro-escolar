import { z } from "zod";

export const createAssessmentScoreSchema = z.object({
  assessmentId: z.number(),
  studentId: z.number(),
  score: z.number().min(0).max(100), // Assuming max score is 100, can be adjusted based on assessment.maxScore
  feedback: z.string().optional().nullable(),
});

export type CreateAssessmentScoreInput = z.infer<
  typeof createAssessmentScoreSchema
>;
