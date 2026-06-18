import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import {
  createEntityRow,
  getAssessmentById,
  getClassSubjectById,
  getTeacherProfile,
  isStudentEnrolledInClass,
  listEntityRows,
  updateEntityRow,
} from "../../db";
import { createAssessmentScoreSchema } from "./grades.schema";

export const gradesRouter = router({
  // Create or update (upsert) assessment score
  record: protectedProcedure
    .input(createAssessmentScoreSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const teacherProfile = await getTeacherProfile(ctx.user.id);
      if (!teacherProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas professores podem lançar notas",
        });
      }

      // 1. Assessment must exist
      const assessment = await getAssessmentById(input.assessmentId);
      if (!assessment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      // 2. Teacher must own this assessment
      if (assessment.teacherId !== teacherProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é o professor desta avaliação",
        });
      }

      // 3. Score must not exceed maxScore
      const maxScore = parseFloat(String(assessment.maxScore));
      if (input.score > maxScore) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Nota excede o valor máximo da avaliação (max: ${maxScore})`,
        });
      }

      // 4. Student must be enrolled in the class
      const classSubject = await getClassSubjectById(assessment.classSubjectId);
      if (!classSubject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Disciplina da turma não encontrada",
        });
      }

      const enrolled = await isStudentEnrolledInClass(
        input.studentId,
        classSubject.classId
      );
      if (!enrolled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Aluno não está matriculado nesta turma",
        });
      }

      // 5. Upsert: check if score already exists
      const existingScores = await listEntityRows("assessmentScores", {
        filters: {
          assessmentId: input.assessmentId,
          studentId: input.studentId,
        },
        limit: 1,
      });

      let result;
      let notify = false;

      if (existingScores.length > 0) {
        // Update existing score
        const existing = existingScores[0] as Record<string, unknown>;
        const oldScore = parseFloat(String(existing.score));
        const newScore = Number(input.score);

        if (oldScore !== newScore) {
          // Score changed — update and notify
          result = await updateEntityRow(
            "assessmentScores",
            existing.id as number,
            {
              score: String(newScore),
              feedback: input.feedback || null,
              updatedAt: new Date().toISOString(),
            }
          );

          // Record history for audit
          try {
            await createEntityRow("auditLogs", {
              userId: ctx.user.id,
              action: "update",
              entity: "assessmentScores",
              entityId: existing.id as number,
              changes: JSON.stringify({ oldScore, newScore }),
              schoolId: (classSubject as Record<string, unknown>).schoolId,
              ipAddress: null,
            });
          } catch (e) {
            console.error("Failed to log grade change:", e);
          }

          notify = true;
        } else {
          // Same score — idempotent, no notification
          result = existing;
        }
      } else {
        // Create new score
        result = await createEntityRow("assessmentScores", {
          assessmentId: input.assessmentId,
          studentId: input.studentId,
          score: String(input.score),
          feedback: input.feedback || null,
        });
        notify = true;
      }

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao lançar nota",
        });
      }

      // Trigger grade notification only if score changed or is new
      if (notify) {
        try {
          const { NotificationService } = await import(
            "../notifications/notification.service"
          );
          // Resolve subject name via classSubject -> subject
          const { getEntityById } = await import("../../db");
          const subjectObj = await getEntityById("subjects", classSubject.subjectId);
          await NotificationService.notifyGradePublished(
            input.studentId,
            assessment.title,
            subjectObj?.name ?? "Disciplina",
            Number(input.score)
          );
        } catch (error) {
          console.error("Failed to create grade notification:", error);
        }
      }

      return {
        success: true,
        score: result,
        isNew: existingScores.length === 0,
      };
    }),

  // Get scores by assessment
  assessmentCreate: protectedProcedure
    .input(
      z.object({
        classSubjectId: z.number().int().positive(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        maxScore: z.number().min(0).max(100).default(10),
        weight: z.number().min(0).max(10).default(1),
        assessmentDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const teacherProfile = await getTeacherProfile(ctx.user.id);
      if (!teacherProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas professores podem criar avaliações",
        });
      }

      const classSubject = await getClassSubjectById(input.classSubjectId);
      if (!classSubject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Disciplina da turma não encontrada",
        });
      }

      const assessment = await createEntityRow("assessments", {
        classSubjectId: input.classSubjectId,
        teacherId: teacherProfile.id,
        title: input.title,
        description: input.description || null,
        maxScore: String(input.maxScore),
        weight: String(input.weight),
        assessmentDate: input.assessmentDate,
      });

      if (!assessment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao criar avaliação",
        });
      }

      return { success: true, assessment };
    }),

  // Class summary — performance overview for teacher
  classSummary: protectedProcedure
    .input(
      z.object({
        classSubjectId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const teacherProfile = await getTeacherProfile(ctx.user.id);
      if (!teacherProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito a professores",
        });
      }

      // Get assessments for this class subject
      const assessments = await listEntityRows("assessments", {
        filters: { classSubjectId: input.classSubjectId },
        limit: 100,
      });

      // Get all scores for these assessments
      const assessmentIds = assessments.map(
        (a: Record<string, unknown>) => a.id as number
      );
      const allScores = await listEntityRows("assessmentScores", {
        limit: 5000,
      });
      const scores = allScores.filter((s: Record<string, unknown>) =>
        assessmentIds.includes(s.assessmentId as number)
      );

      // Calculate class average
      const totalScore = scores.reduce(
        (sum: number, s: Record<string, unknown>) =>
          sum + parseFloat(String(s.score)),
        0
      );
      const classAverage = scores.length > 0 ? totalScore / scores.length : 0;

      // Distribution
      const distribution = { "0-4": 0, "4-6": 0, "6-8": 0, "8-10": 0 };
      for (const s of scores) {
        const score = parseFloat(String((s as Record<string, unknown>).score));
        if (score < 4) distribution["0-4"]++;
        else if (score < 6) distribution["4-6"]++;
        else if (score < 8) distribution["6-8"]++;
        else distribution["8-10"]++;
      }

      return {
        assessments,
        classAverage: Math.round(classAverage * 100) / 100,
        distribution,
        totalStudents: new Set(
          scores.map((s: Record<string, unknown>) => s.studentId as number)
        ).size,
      };
    }),

  // Get scores by assessment
  byAssessment: protectedProcedure
    .input(
      z.object({
        assessmentId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const teacherProfile = await getTeacherProfile(ctx.user.id);
      if (!teacherProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito a professores",
        });
      }

      const assessment = await getAssessmentById(input.assessmentId);
      if (!assessment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      if (assessment.teacherId !== teacherProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é o professor desta avaliação",
        });
      }

      return await listEntityRows("assessmentScores", {
        filters: { assessmentId: input.assessmentId },
        limit: 200,
      });
    }),
});
