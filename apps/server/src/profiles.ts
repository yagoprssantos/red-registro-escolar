import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./core/trpc";
import {
  getGuardianProfile,
  getGuardianStudentPerformance,
  getGuardianStudents,
  getScheduleSlots,
  getSchoolPlatforms,
  getStudentAttendanceStats,
  getStudentClassInfo,
  getStudentCommunications,
  getStudentGrades,
  getStudentNextExam,
  getStudentProfile,
  getStudentUpcomingEvents,
  getTeacherClassGrades,
  getTeacherClasses,
  getTeacherProfile,
  listNotificationsForUser,
} from "./db";

export const profilesRouter = router({
  teacher: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      const teacher = await getTeacherProfile(ctx.user.id);
      if (!teacher)
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de professor não encontrado" });
      return teacher;
    }),

    classes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getTeacherClasses(ctx.user.id);
    }),

    grades: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        return await getTeacherClassGrades(ctx.user.id, input.classId);
      }),

    notifications: protectedProcedure
      .input(z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        return await listNotificationsForUser(ctx.user.id, {
          unreadOnly: input.unreadOnly,
          limit: input.limit,
          offset: input.offset,
        });
      }),
  }),

  student: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      const student = await getStudentProfile(ctx.user.id);
      if (!student)
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de aluno não encontrado" });
      return student;
    }),

    grades: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getStudentGrades(ctx.user.id);
    }),

    communications: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getStudentCommunications(ctx.user.id);
    }),

    attendance: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getStudentAttendanceStats(ctx.user.id);
    }),

    classInfo: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getStudentClassInfo(ctx.user.id);
    }),

    events: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getStudentUpcomingEvents(ctx.user.id);
    }),

    nextExam: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getStudentNextExam(ctx.user.id);
    }),

    platforms: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      const student = await getStudentProfile(ctx.user.id);
      if (!student) return [];
      return await getSchoolPlatforms(student.schoolId as number);
    }),

    scheduleSlots: protectedProcedure
      .input(z.object({ shift: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        const student = await getStudentProfile(ctx.user.id);
        if (!student) return [];
        return await getScheduleSlots(student.schoolId as number, input.shift);
      }),

    notifications: protectedProcedure
      .input(z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        return await listNotificationsForUser(ctx.user.id, {
          unreadOnly: input.unreadOnly,
          limit: input.limit,
          offset: input.offset,
        });
      }),
  }),

  guardian: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      const guardian = await getGuardianProfile(ctx.user.id);
      if (!guardian)
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de responsável não encontrado" });
      return guardian;
    }),

    students: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      return await getGuardianStudents(ctx.user.id);
    }),

    studentPerformance: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        const performance = await getGuardianStudentPerformance(ctx.user.id, input.studentId);
        if (!performance)
          throw new TRPCError({ code: "FORBIDDEN", message: "Aluno não está vinculado a este responsável" });
        return performance;
      }),

    platforms: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      const guardian = await getGuardianProfile(ctx.user.id);
      if (!guardian) return [];
      const students = await getGuardianStudents(ctx.user.id);
      const schoolId = (students as any[])?.[0]?.schoolId;
      if (!schoolId) return [];
      return await getSchoolPlatforms(schoolId as number);
    }),

    notifications: protectedProcedure
      .input(z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        return await listNotificationsForUser(ctx.user.id, {
          unreadOnly: input.unreadOnly,
          limit: input.limit,
          offset: input.offset,
        });
      }),
  }),
});

export type ProfilesRouter = typeof profilesRouter;
