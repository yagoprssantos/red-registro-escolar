import { createAssessmentScore } from "../../db";

export class GradesService {
  /**
   * Create an assessment score for a student
   * @param input Assessment score data
   * @returns Created assessment score
   */
  static async createAssessmentScore(input: {
    assessmentId: number;
    studentId: number;
    score: number;
    feedback?: string | null;
  }) {
    return await createAssessmentScore(input);
  }
}
