import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import { AuditService } from "./audit.service";

export const auditRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        userId: z.number().int().positive().optional(),
        entity: z.string().optional(),
        action: z.string().optional(),
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

      return await AuditService.listLogs(input.schoolId, {
        userId: input.userId,
        entity: input.entity,
        action: input.action,
      });
    }),
});
