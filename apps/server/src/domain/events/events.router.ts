import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import { createEventInput } from "./events.schema";
import { EventsService } from "./events.service";

export const eventsRouter = router({
  // School: create event
  create: protectedProcedure
    .input(createEventInput)
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

      const event = await EventsService.createEvent(
        input.schoolId,
        ctx.user.id,
        input
      );

      // Trigger notification
      try {
        const { NotificationService } = await import(
          "../notifications/notification.service"
        );
        const eventId = (event as Record<string, unknown>).id as number;
        await NotificationService.notifyEvent(eventId);
      } catch (error) {
        console.error("Failed to create event notifications:", error);
      }

      return { success: true, event };
    }),

  // Get events for current user
  forUser: protectedProcedure
    .input(z.object({ schoolId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }
      return await EventsService.getEventsForUser(ctx.user.id, input.schoolId);
    }),
});
