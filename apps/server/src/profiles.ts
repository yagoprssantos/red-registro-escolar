import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./core/trpc";

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

      // TODO: Buscar dados do professor no banco
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        subject: "Matemática",
        school: "Escola Municipal ABC",
        classes: [],
        students: [],
      };
    }),

    classes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // TODO: Buscar turmas do professor
      return [
        { id: 1, name: "6º Ano A", subject: "Matemática", students: 28 },
        { id: 2, name: "6º Ano B", subject: "Matemática", students: 26 },
        { id: 3, name: "7º Ano A", subject: "Matemática", students: 30 },
      ];
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

        // TODO: Buscar notas da turma
        return [];
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

      // TODO: Buscar dados do aluno no banco
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        grade: "6º Ano A",
        school: "Escola Municipal ABC",
        averageGrade: 8.5,
        absences: 2,
      };
    }),

    grades: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // TODO: Buscar notas do aluno
      return [
        { subject: "Matemática", grade: 8.5, date: "2026-04-15" },
        { subject: "Português", grade: 9.0, date: "2026-04-14" },
        { subject: "Ciências", grade: 7.8, date: "2026-04-12" },
      ];
    }),

    communications: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // TODO: Buscar comunicados da escola
      return [];
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

      // TODO: Buscar dados do responsável
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        relationship: "Pai",
        students: [],
      };
    }),

    students: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // TODO: Buscar filhos/alunos do responsável
      return [];
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

        // TODO: Buscar desempenho do aluno
        return {
          studentId: input.studentId,
          grades: [],
          absences: 0,
          alerts: [],
        };
      }),
  }),
});

export type ProfilesRouter = typeof profilesRouter;
