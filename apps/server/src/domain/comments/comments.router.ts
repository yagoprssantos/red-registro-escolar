import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import { getTeacherProfile } from "../../db";
import { createCommentSchema } from "./comments.schema";
import { CommentsService } from "./comments.service";

function stripAuthorFields(
  comment: Record<string, unknown>,
  viewer: "student" | "guardian" | "school"
): Record<string, unknown> {
  if (viewer === "student") {
    const { author, teacherId, authorName, teacherName, ...rest } =
      comment as any;
    return rest;
  }
  return comment;
}

export const commentsRouter = router({
  create: protectedProcedure
    .input(createCommentSchema)
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
          message: "Apenas professores pueden crear comentarios",
        });
      }

      // teacherId/authorId DERIVED from context, never from input
      const { createStudentComment } = await import("../../db");
      const createdComment = await createStudentComment({
        schoolId: teacherProfile.schoolId,
        studentId: input.studentId,
        teacherId: teacherProfile.id, // Always from authenticated context
        classSubjectId: null,
        category: input.category,
        visibility: input.visibility,
        content: input.content,
      });

      if (!createdComment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao criar comentário",
        });
      }

      // Trigger comment notification based on visibility
      try {
        const { NotificationService } = await import("../notifications/notification.service");
        const { getTeacherProfile, getEntityById } = await import("../../db");

        const teacherProfile = await getTeacherProfile(ctx.user.id);
        const student = await getEntityById("students", input.studentId);

        if (teacherProfile && student) {
          await NotificationService.notifyComment(
            input.studentId,
            input.visibility,
            teacherProfile.name,
            input.category
          );
        }
      } catch (error) {
        // Log error but don't break the main operation
        console.error("Failed to create comment notification:", error);
      }

      return {
        success: true,
        comment: createdComment,
      };
    }),

  forStudent: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // Viewer role ALWAYS derived from authenticated context — never from client param
      let viewer: "student" | "guardian" | "school" = "guardian";

      const role = ctx.user.role;
      if (role === "admin" || role === "school_staff" || role === "teacher") {
        viewer = "school";
      } else if (role === "student") {
        viewer = "student";
      } else if (role === "guardian") {
        viewer = "guardian";
      }

      const comments = await CommentsService.getForStudent(
        input.studentId,
        viewer
      );
      return comments.map(c =>
        stripAuthorFields(c as Record<string, unknown>, viewer)
      );
    }),

  byTeacher: protectedProcedure
    .input(
      z.object({
        teacherId: z.number(),
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
      if (!teacherProfile || teacherProfile.id !== input.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Não autorizado a acessar comentários deste professor",
        });
      }

      return await CommentsService.getByTeacher(input.teacherId);
    }),
});
