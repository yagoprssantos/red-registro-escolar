import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./core/trpc";
import {
  getEntityById,
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
  listEntityRows,
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

    classDetails: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const student = await getStudentProfile(ctx.user.id);
      if (!student) return null;

      const enrollments = await listEntityRows("classEnrollments", {
        filters: { studentId: student.id as number, status: "ativo" },
        limit: 1,
      });
      if (!enrollments.length) return null;

      const classId = enrollments[0].classId as number;

      const [cls, classmateEnrollments, classSubjects] = await Promise.all([
        getEntityById("classes", classId),
        listEntityRows("classEnrollments", {
          filters: { classId, status: "ativo" },
          limit: 60,
        }),
        listEntityRows("classSubjects", { filters: { classId }, limit: 30 }),
      ]);

      const classmateIds = (classmateEnrollments as Array<Record<string, unknown>>)
        .map(e => e.studentId as number)
        .filter(id => id != null && id !== (student.id as number));

      const csIds = (classSubjects as Array<Record<string, unknown>>).map(cs => cs.id as number);
      const subjectIds = (classSubjects as Array<Record<string, unknown>>).map(cs => cs.subjectId as number);

      const [classmates, subjectDefs, classTeachers] = await Promise.all([
        classmateIds.length > 0
          ? listEntityRows("students", { filters: { id: classmateIds }, limit: classmateIds.length })
          : Promise.resolve([]),
        subjectIds.length > 0
          ? listEntityRows("subjects", { filters: { id: subjectIds }, limit: subjectIds.length })
          : Promise.resolve([]),
        csIds.length > 0
          ? listEntityRows("classTeachers", { filters: { classSubjectId: csIds }, limit: csIds.length })
          : Promise.resolve([]),
      ]);

      const teacherIds = Array.from(
        new Set((classTeachers as Array<Record<string, unknown>>).map(ct => ct.teacherId as number))
      );
      const teachers = teacherIds.length > 0
        ? await listEntityRows("teachers", { filters: { id: teacherIds }, limit: teacherIds.length })
        : [];

      return {
        class: cls,
        classmates: (classmates as Array<Record<string, unknown>>).map(s => ({
          id: s.id as number,
          name: s.name as string,
        })),
        subjects: (classSubjects as Array<Record<string, unknown>>).map(cs => {
          const subDef = (subjectDefs as Array<Record<string, unknown>>).find(s => s.id === cs.subjectId);
          const ct = (classTeachers as Array<Record<string, unknown>>).find(c => c.classSubjectId === cs.id);
          const teacher = ct
            ? (teachers as Array<Record<string, unknown>>).find(t => t.id === ct.teacherId)
            : null;
          return {
            id: cs.id as number,
            subjectId: cs.subjectId as number,
            subjectName: (subDef?.name as string) ?? "—",
            teacherName: (teacher?.name as string) ?? null,
          };
        }),
      };
    }),

    guardians: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const student = await getStudentProfile(ctx.user.id);
      if (!student) return [];

      const links = await listEntityRows("studentGuardians", {
        filters: { studentId: student.id as number },
        limit: 10,
      });
      if (!links.length) return [];

      const guardianIds = (links as Array<Record<string, unknown>>).map(l => l.guardianId as number);
      const guardians = await listEntityRows("guardians", {
        filters: { id: guardianIds },
        limit: guardianIds.length,
      });

      return (guardians as Array<Record<string, unknown>>).map(g => ({
        id: g.id as number,
        name: g.name as string,
        email: g.email as string | null,
        phone: g.phone as string | null,
        relationship: ((links as Array<Record<string, unknown>>).find(l => l.guardianId === g.id)?.relationship as string) ?? null,
      }));
    }),

    attendanceDetail: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const student = await getStudentProfile(ctx.user.id);
      if (!student) return [];

      const records = await listEntityRows("attendanceRecords", {
        filters: { studentId: student.id as number },
        limit: 500,
      });
      if (!records.length) return [];

      const sessionIds = Array.from(
        new Set((records as Array<Record<string, unknown>>).map(r => r.classSessionId as number))
      );
      const sessions = sessionIds.length > 0
        ? await listEntityRows("classSessions", { filters: { id: sessionIds }, limit: sessionIds.length })
        : [];

      const csIds = Array.from(
        new Set((sessions as Array<Record<string, unknown>>).map(s => s.classSubjectId as number))
      );
      const classSubjects = csIds.length > 0
        ? await listEntityRows("classSubjects", { filters: { id: csIds }, limit: csIds.length })
        : [];

      const subjectIds = Array.from(
        new Set((classSubjects as Array<Record<string, unknown>>).map(cs => cs.subjectId as number))
      );
      const subjects = subjectIds.length > 0
        ? await listEntityRows("subjects", { filters: { id: subjectIds }, limit: subjectIds.length })
        : [];

      const sessionMap = new Map((sessions as Array<Record<string, unknown>>).map(s => [s.id as number, s]));
      const csMap = new Map((classSubjects as Array<Record<string, unknown>>).map(cs => [cs.id as number, cs]));
      const subjectMap = new Map((subjects as Array<Record<string, unknown>>).map(s => [s.id as number, s]));

      return (records as Array<Record<string, unknown>>).map(r => {
        const session = sessionMap.get(r.classSessionId as number);
        const cs = session ? csMap.get(session.classSubjectId as number) : null;
        const subject = cs ? subjectMap.get(cs.subjectId as number) : null;
        return {
          id: r.id as number,
          status: r.status as "present" | "absent" | "justified",
          date: (session?.lessonDate as string) ?? "",
          subject: (subject?.name as string) ?? "—",
          subjectId: (cs?.subjectId as number) ?? null,
        };
      });
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
