import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createContact, getContacts } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  contacts: router({
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        school: z.string().min(1, "Nome da escola é obrigatório"),
        role: z.string().min(1, "Cargo é obrigatório"),
        students: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const contact = await createContact({
            name: input.name,
            email: input.email,
            school: input.school,
            role: input.role,
            students: input.students || null,
            message: input.message || null,
            status: "novo",
          });
          return { success: true, contact };
        } catch (error) {
          console.error("Failed to create contact:", error);
          throw new Error("Falha ao enviar formulário. Tente novamente.");
        }
      }),
    list: publicProcedure
      .query(async () => {
        try {
          return await getContacts(100, 0);
        } catch (error) {
          console.error("Failed to fetch contacts:", error);
          return [];
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
