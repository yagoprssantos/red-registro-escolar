import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import { createEntityRow, listEntityRows, updateEntityRow, getStudentProfile, getTeacherProfile } from "../../db";

export const tasksRouter = router({
  // List tasks for the student's current class subjects
  forStudent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

    const student = await getStudentProfile(ctx.user.id);
    if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de aluno não encontrado" });

    const studentId = student.id as number;

    const enrollments = await listEntityRows("classEnrollments", {
      filters: { studentId, status: "ativo" },
      limit: 1,
    });
    if (!enrollments.length) return [];

    const classId = (enrollments[0] as Record<string, unknown>).classId as number;
    const classSubjects = await listEntityRows("classSubjects", {
      filters: { classId },
      limit: 30,
    });
    const csIds = (classSubjects as Array<Record<string, unknown>>).map(cs => cs.id as number);
    if (!csIds.length) return [];

    const tasks = await listEntityRows("tasks", {
      filters: { classSubjectId: csIds },
      limit: 100,
      orderBy: "dueDate",
      orderDirection: "asc",
    });

    const taskIds = (tasks as Array<Record<string, unknown>>).map(t => t.id as number);
    const submissions = taskIds.length > 0
      ? await listEntityRows("taskSubmissions", {
          filters: { taskId: taskIds, studentId },
          limit: taskIds.length,
        })
      : [];

    const subjectIds = Array.from(
      new Set((classSubjects as Array<Record<string, unknown>>).map(cs => cs.subjectId as number))
    );
    const subjects = subjectIds.length > 0
      ? await listEntityRows("subjects", { filters: { id: subjectIds }, limit: subjectIds.length })
      : [];

    const csMap = new Map(
      (classSubjects as Array<Record<string, unknown>>).map(cs => [cs.id as number, cs])
    );
    const subjectMap = new Map(
      (subjects as Array<Record<string, unknown>>).map(s => [s.id as number, s])
    );
    const submissionMap = new Map(
      (submissions as Array<Record<string, unknown>>).map(s => [s.taskId as number, s])
    );

    return (tasks as Array<Record<string, unknown>>).map(task => {
      const cs = csMap.get(task.classSubjectId as number);
      const subject = cs ? subjectMap.get(cs.subjectId as number) : null;
      const submission = submissionMap.get(task.id as number) ?? null;
      return {
        id: task.id as number,
        title: task.title as string,
        description: (task.description as string | null) ?? null,
        taskType: task.taskType as string,
        dueDate: task.dueDate as string,
        maxScore: Number(task.maxScore ?? 10),
        subjectName: (subject?.name as string) ?? "—",
        submission: submission
          ? {
              id: (submission as Record<string, unknown>).id as number,
              answer: (submission as Record<string, unknown>).answer as string | null,
              fileUrl: (submission as Record<string, unknown>).fileUrl as string | null,
              score: (submission as Record<string, unknown>).score != null
                ? Number((submission as Record<string, unknown>).score)
                : null,
              feedback: (submission as Record<string, unknown>).feedback as string | null,
              submittedAt: (submission as Record<string, unknown>).submittedAt as string | null,
              gradedAt: (submission as Record<string, unknown>).gradedAt as string | null,
            }
          : null,
      };
    });
  }),

  // Submit a text answer or file URL for a task
  submit: protectedProcedure
    .input(z.object({
      taskId: z.number().int().positive(),
      answer: z.string().optional(),
      fileUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const student = await getStudentProfile(ctx.user.id);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de aluno não encontrado" });

      const studentId = student.id as number;

      const existing = await listEntityRows("taskSubmissions", {
        filters: { taskId: input.taskId, studentId },
        limit: 1,
      });

      if (existing.length > 0) {
        const sub = existing[0] as Record<string, unknown>;
        const updated = await updateEntityRow("taskSubmissions", sub.id as number, {
          answer: input.answer ?? (sub.answer as string | null),
          fileUrl: input.fileUrl ?? (sub.fileUrl as string | null),
          submittedAt: new Date().toISOString(),
        });
        return updated;
      }

      return await createEntityRow("taskSubmissions", {
        taskId: input.taskId,
        studentId,
        answer: input.answer ?? null,
        fileUrl: input.fileUrl ?? null,
        submittedAt: new Date().toISOString(),
      });
    }),

  // List tasks for teacher's class to grade submissions
  forTeacher: protectedProcedure
    .input(z.object({ classSubjectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const teacher = await getTeacherProfile(ctx.user.id);
      if (!teacher) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de professor não encontrado" });

      const tasks = await listEntityRows("tasks", {
        filters: { classSubjectId: input.classSubjectId },
        limit: 100,
      });

      const taskIds = (tasks as Array<Record<string, unknown>>).map(t => t.id as number);
      const submissions = taskIds.length > 0
        ? await listEntityRows("taskSubmissions", {
            filters: { taskId: taskIds },
            limit: 500,
          })
        : [];

      return { tasks, submissions };
    }),

  // Grade a submission
  grade: protectedProcedure
    .input(z.object({
      submissionId: z.number().int().positive(),
      score: z.number().min(0),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const teacher = await getTeacherProfile(ctx.user.id);
      if (!teacher) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de professor não encontrado" });

      return await updateEntityRow("taskSubmissions", input.submissionId, {
        score: String(input.score),
        feedback: input.feedback ?? null,
        gradedAt: new Date().toISOString(),
      });
    }),

  // Create a task (teacher)
  create: protectedProcedure
    .input(z.object({
      classSubjectId: z.number().int().positive(),
      title: z.string().min(1),
      description: z.string().optional(),
      taskType: z.enum(["trabalho", "atividade"]),
      dueDate: z.string(),
      maxScore: z.number().min(0).default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });

      const teacher = await getTeacherProfile(ctx.user.id);
      if (!teacher) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de professor não encontrado" });

      return await createEntityRow("tasks", {
        classSubjectId: input.classSubjectId,
        teacherId: (teacher as Record<string, unknown>).id as number,
        title: input.title,
        description: input.description ?? null,
        taskType: input.taskType,
        dueDate: input.dueDate,
        maxScore: String(input.maxScore),
      });
    }),
});
