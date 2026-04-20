import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./core/trpc";
import {
  getGuardianProfile,
  getGuardianStudentPerformance,
  getGuardianStudents,
  getStudentCommunications,
  getStudentGrades,
  getStudentProfile,
  getTeacherClassGrades,
  getTeacherClasses,
  getTeacherProfile,
} from "./db";

/**
 * Routers específicos para cada perfil de usuário
 */

export const profilesRouter = router({
  /**
   * Router para Professores
   */
  teacher: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const teacher = await getTeacherProfile(ctx.user.id);

      if (!teacher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de professor não encontrado",
        });
      }

      return teacher;
    }),

    classes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      return await getTeacherClasses(ctx.user.id);
    }),

    grades: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuário não autenticado",
          });
        }

        return await getTeacherClassGrades(ctx.user.id, input.classId);
      }),
  }),

  /**
   * Router para Alunos
   */
  student: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const student = await getStudentProfile(ctx.user.id);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de aluno não encontrado",
        });
      }

      return student;
    }),

    grades: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      return await getStudentGrades(ctx.user.id);
    }),

    communications: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      return await getStudentCommunications(ctx.user.id);
    }),
  }),

  /**
   * Router para Responsáveis
   */
  guardian: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const guardian = await getGuardianProfile(ctx.user.id);

      if (!guardian) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de responsável não encontrado",
        });
      }

      return guardian;
    }),

    students: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      return await getGuardianStudents(ctx.user.id);
    }),

    studentPerformance: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuário não autenticado",
          });
        }

        const performance = await getGuardianStudentPerformance(
          ctx.user.id,
          input.studentId
        );

        if (!performance) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Aluno não está vinculado a este responsável",
          });
        }

        return performance;
      }),
  }),
});

export type ProfilesRouter = typeof profilesRouter;
