import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import {
  createCommunicationInput,
  markReadInput,
} from "./communications.schema";
import { CommunicationsService } from "./communications.service";

export const communicationsRouter = router({
  // School: publish communication with bulk recipients
  create: protectedProcedure
    .input(createCommunicationInput)
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

      const result = await CommunicationsService.publishCommunication(
        input.schoolId,
        ctx.user.id,
        input
      );

      // Trigger notifications
      try {
        const { NotificationService } = await import(
          "../notifications/notification.service"
        );
        const commId = (result.communication as Record<string, unknown>)
          .id as number;
        await NotificationService.notifyCommunication(commId);
      } catch (error) {
        console.error("Failed to create communication notifications:", error);
      }

      return { success: true, ...result };
    }),

  // List communications for the current user
  forUser: protectedProcedure
    .input(z.object({ schoolId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }
      return await CommunicationsService.getCommunicationsForUser(
        ctx.user.id,
        input.schoolId
      );
    }),

  // Mark as read
  markRead: protectedProcedure
    .input(markReadInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }
      await CommunicationsService.markRead(input.communicationId, ctx.user.id);
      return { success: true };
    }),

  // School: get read stats
  readStats: protectedProcedure
    .input(z.object({ communicationId: z.number().int().positive() }))
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
      return await CommunicationsService.getReadStats(input.communicationId);
    }),

  // School: list all communications
  listBySchool: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        limit: z.number().int().min(1).max(200).default(50),
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
      const { listEntityRows } = await import("../../db");
      return await listEntityRows("communications", {
        filters: { schoolId: input.schoolId },
        limit: input.limit,
        orderBy: "createdAt",
        orderDirection: "desc",
      });
    }),
});
