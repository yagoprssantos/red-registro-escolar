import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import {
  justifyAbsenceInput,
  reviewJustificationInput,
} from "./justifications.schema";
import { JustificationsService } from "./justifications.service";

export const justificationsRouter = router({
  // Guardian: create justification
  create: protectedProcedure
    .input(justifyAbsenceInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const justification = await JustificationsService.justifyAbsence(
        ctx.user.id,
        input
      );

      // Trigger notification to school/teacher
      try {
        const { NotificationService } = await import(
          "../notifications/notification.service"
        );
        const { listEntityRows, getEntityById } = await import("../../db");
        const j = justification as Record<string, unknown>;
        const guardian = await getEntityById(
          "guardians",
          j.guardianId as number
        );
        const attendanceRecord = await getEntityById(
          "attendanceRecords",
          j.attendanceRecordId as number
        );
        if (attendanceRecord && guardian) {
          const ar = attendanceRecord as Record<string, unknown>;
          const student = await getEntityById(
            "students",
            ar.studentId as number
          );
          // Notify school staff about pending justification
          const schoolStaff = await listEntityRows("schoolStaffProfiles", {
            filters: { schoolId: j.schoolId },
          });
          const { createNotification } = await import("../../db");
          for (const staff of schoolStaff) {
            const s = staff as Record<string, unknown>;
            if (s.userId) {
              await createNotification({
                userId: s.userId as number,
                notificationType: "justification_pending",
                title: "Justificativa pendente",
                body: `${(student as Record<string, unknown>)?.name || "Aluno"} — Nova justificativa de falta aguardando revisão`,
                actionUrl: "/dashboard/justificativas",
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to create justification notifications:", error);
      }

      return { success: true, justification };
    }),

  // Guardian: list own justifications
  listMine: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }
    return await JustificationsService.listMyJustifications(ctx.user.id);
  }),

  // School: list justifications by school
  listBySchool: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }
      return await JustificationsService.listBySchool(
        input.schoolId,
        input.status
      );
    }),

  // School: review (approve/reject) justification
  review: protectedProcedure
    .input(reviewJustificationInput)
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }

      const result = await JustificationsService.reviewJustification(
        ctx.user.id,
        input
      );

      // Notify guardian about result
      try {
        const { NotificationService } = await import(
          "../notifications/notification.service"
        );
        const { getEntityById } = await import("../../db");
        const j = (await getEntityById(
          "absenceJustifications",
          input.justificationId
        )) as Record<string, unknown>;
        if (j) {
          await NotificationService.notifyJustificationResult(
            j.guardianId as number,
            input.status,
            input.reviewNotes || undefined
          );
        }
      } catch (error) {
        console.error(
          "Failed to create justification result notification:",
          error
        );
      }

      return { success: true, justification: result };
    }),

  // Get justification by ID
  byId: protectedProcedure
    .input(z.object({ justificationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }
      return await JustificationsService.getById(input.justificationId);
    }),
});
