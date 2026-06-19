import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import {
  attendanceRecordExists,
  getAttendanceRecordsBySession,
  getClassSessionById,
  getClassSubjectById,
  getTeacherProfile,
  isStudentEnrolledInClass,
  isTeacherOfClassSubject,
} from "../../db";
import { createAttendanceRecordSchema } from "./attendance.schema";
import { AttendanceService } from "./attendance.service";

export const attendanceRouter = router({
  create: protectedProcedure
    .input(createAttendanceRecordSchema)
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
          message: "Apenas professores podem registrar chamada",
        });
      }

      // 1. Verify classSession exists
      const session = await getClassSessionById(input.classSessionId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sessão de aula não encontrada",
        });
      }

      // 2. Teacher must be the one assigned to this session
      if (session.teacherId !== teacherProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é o professor desta sessão",
        });
      }

      // 3. Verify teacher is linked to the classSubject
      const classSubject = await getClassSubjectById(session.classSubjectId);
      if (!classSubject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Disciplina da turma não encontrada",
        });
      }

      const teacherLinked = await isTeacherOfClassSubject(
        teacherProfile.id,
        session.classSubjectId
      );
      if (!teacherLinked) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Professor não está vinculado a esta disciplina/turma",
        });
      }

      // 4. Date cannot be in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lessonDate = new Date(session.lessonDate);
      lessonDate.setHours(0, 0, 0, 0);
      if (lessonDate.getTime() > today.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível registrar chamada para data futura",
        });
      }

      // 5. Student must be enrolled in the class
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

      // 6. No duplicate attendance record
      const exists = await attendanceRecordExists(
        input.classSessionId,
        input.studentId
      );
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Chamada já registrada para este aluno nesta sessão",
        });
      }

      const createdAttendance = await AttendanceService.createAttendanceRecord({
        classSessionId: input.classSessionId,
        studentId: input.studentId,
        status: input.status,
        reason: input.reason,
        recordedByTeacherId: teacherProfile.id,
      });

      if (!createdAttendance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao registrar chamada",
        });
      }

      // Trigger absence notification if student was marked absent
      if (input.status === "absent") {
        try {
          const { NotificationService } = await import(
            "../notifications/notification.service"
          );
          const {
            getClassSessionById,
            getTeacherProfile,
            getClassSubjectById,
            getEntityById,
          } = await import("../../db");

          const session = await getClassSessionById(input.classSessionId);
          if (session) {
            const teacherProfile = await getTeacherProfile(ctx.user.id);
            const classSubject = await getClassSubjectById(
              session.classSubjectId
            );

            if (teacherProfile && classSubject) {
              const subject = await getEntityById("subjects", classSubject.subjectId);
              const subjectName = (subject as Record<string, unknown>)?.name as string ?? "Unknown Subject";

              // Single absence notification
              await NotificationService.notifyAbsence(
                input.studentId,
                session.lessonDate,
                subjectName,
                teacherProfile.name
              );

              // Check for 3+ consecutive absences
              await NotificationService.notifyConsecutiveAbsence(
                input.studentId,
                session.lessonDate,
                subjectName
              );
            }
          }
        } catch (error) {
          console.error("Failed to create absence notification:", error);
        }
      }

      return {
        success: true,
        attendance: createdAttendance,
      };
    }),

  bySession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      return await getAttendanceRecordsBySession(input.sessionId);
    }),
});
