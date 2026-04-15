import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createContact, getContacts, createSchool, getSchoolByEmail, getUserSchools, createUserSchool, getSchoolContacts } from "./db";
import { TRPCError } from "@trpc/server";
import { profilesRouter } from "./profiles";

export const appRouter = router({
  system: systemRouter,
  profiles: profilesRouter,
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
        schoolId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const contact = await createContact({
            schoolId: input.schoolId || null,
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

  schools: router({
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome da escola é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        studentCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Verificar se escola já existe
          const existing = await getSchoolByEmail(input.email);
          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Uma escola com este email já está registrada",
            });
          }

          const school = await createSchool({
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            address: input.address || null,
            city: input.city || null,
            state: input.state || null,
            zipCode: input.zipCode || null,
            studentCount: input.studentCount || null,
            status: "trial",
          });

          if (!school) {
            throw new Error("Falha ao registrar escola");
          }

          return { success: true, school };
        } catch (error) {
          console.error("Failed to register school:", error);
          if (error instanceof TRPCError) throw error;
          throw new Error("Falha ao registrar escola. Tente novamente.");
        }
      }),

    mySchools: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          if (!ctx.user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Usuário não autenticado",
            });
          }

          const userSchools = await getUserSchools(ctx.user.id);
          return userSchools;
        } catch (error) {
          console.error("Failed to fetch user schools:", error);
          if (error instanceof TRPCError) throw error;
          throw new Error("Falha ao carregar escolas");
        }
      }),

    contacts: protectedProcedure
      .input(z.object({
        schoolId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        try {
          if (!ctx.user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Usuário não autenticado",
            });
          }

          // Verificar se o usuário tem acesso a esta escola
          const userSchools = await getUserSchools(ctx.user.id);
          const hasAccess = userSchools.some(us => us.schoolId === input.schoolId);

          if (!hasAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Você não tem acesso a esta escola",
            });
          }

          return await getSchoolContacts(input.schoolId);
        } catch (error) {
          console.error("Failed to fetch school contacts:", error);
          if (error instanceof TRPCError) throw error;
          throw new Error("Falha ao carregar contatos");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
