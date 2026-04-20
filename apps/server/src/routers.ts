import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { schools as schoolsTable } from "../../../drizzle/schema";
import { COOKIE_NAME } from "../../../packages/shared/src/const.ts";
import { getSessionCookieOptions } from "./core/cookies";
import { systemRouter } from "./core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./core/trpc";
import {
  createContact,
  createGuardianProfile,
  createSchool,
  createSchoolStaffProfile,
  createStudentProfile,
  createTeacherProfile,
  createUserSchool,
  getContacts,
  getDb,
  getSchoolByEmail,
  getSchoolContacts,
  getUserSchools,
  linkStudentGuardian,
} from "./db";
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
      .input(
        z.object({
          name: z.string().min(1, "Nome é obrigatório"),
          email: z.string().email("Email inválido"),
          school: z.string().min(1, "Nome da escola é obrigatório"),
          role: z.string().min(1, "Cargo é obrigatório"),
          students: z.string().optional(),
          message: z.string().optional(),
          schoolId: z.number().optional(),
        })
      )
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
    list: publicProcedure.query(async () => {
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
      .input(
        z.object({
          name: z.string().min(1, "Nome da escola é obrigatório"),
          email: z.string().email("Email inválido"),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          studentCount: z.number().optional(),
        })
      )
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

    list: publicProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) return [];
        const schools = await db.select().from(schoolsTable).limit(100);
        return schools;
      } catch (error) {
        console.error("Failed to fetch schools:", error);
        return [];
      }
    }),

    mySchools: protectedProcedure.query(async ({ ctx }) => {
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
      .input(
        z.object({
          schoolId: z.number(),
        })
      )
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
          const hasAccess = userSchools.some(
            us => us.schoolId === input.schoolId
          );

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

  onboarding: router({
    complete: protectedProcedure
      .input(
        z.object({
          personalData: z.object({
            name: z.string().min(1),
            email: z.string().email(),
            phone: z.string().min(1),
          }),
          schoolData: z.object({
            schoolId: z.number().optional(),
            schoolName: z.string().optional(),
            schoolCity: z.string().optional(),
            isNewSchool: z.boolean(),
          }),
          professionalData: z.object({
            subject: z.string().optional(),
            position: z.enum(["teacher", "admin", "guardian"]),
            grade: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Usuário não autenticado",
            });
          }

          let schoolId: number;

          // Se for nova escola, criar
          if (input.schoolData.isNewSchool) {
            const newSchool = await createSchool({
              name: input.schoolData.schoolName || "Sem Nome",
              email: `school-${Date.now()}@red.local`,
              city: input.schoolData.schoolCity || null,
              phone: null,
              address: null,
              state: null,
              zipCode: null,
              studentCount: null,
              status: "trial",
            });
            if (!newSchool) {
              throw new Error("Falha ao criar escola");
            }
            schoolId = newSchool.id;
          } else {
            schoolId = input.schoolData.schoolId || 0;
          }

          // Vincular usuário à escola
          if (schoolId) {
            const roleByPosition =
              input.professionalData.position === "teacher"
                ? "teacher"
                : input.professionalData.position === "guardian"
                  ? "guardian"
                  : "admin";

            await createUserSchool({
              userId: ctx.user.id,
              schoolId: schoolId,
              role: roleByPosition,
            });

            if (input.professionalData.position === "teacher") {
              await createTeacherProfile({
                userId: ctx.user.id,
                schoolId,
                name: input.personalData.name,
                email: input.personalData.email,
                phone: input.personalData.phone,
                subject: input.professionalData.subject || null,
              });
            }

            if (input.professionalData.position === "guardian") {
              const guardian = await createGuardianProfile({
                userId: ctx.user.id,
                schoolId,
                name: input.personalData.name,
                email: input.personalData.email,
                phone: input.personalData.phone,
                relationship: "Responsável",
              });

              // Seed mínimo para o responsável ter ao menos um aluno vinculado.
              if (guardian) {
                const student = await createStudentProfile({
                  schoolId,
                  name: `Aluno de ${input.personalData.name.split(" ")[0]}`,
                  grade: input.professionalData.grade || "6o Ano",
                });

                if (student) {
                  await linkStudentGuardian({
                    studentId: student.id,
                    guardianId: guardian.id,
                    relationship: "Responsável",
                    isPrimary: 1,
                  });
                }
              }
            }

            if (input.professionalData.position === "admin") {
              await createSchoolStaffProfile({
                userId: ctx.user.id,
                schoolId,
                role: "admin",
                positionTitle: "Administrador",
              });
            }
          }

          return {
            success: true,
            message: "Onboarding concluído com sucesso",
          };
        } catch (error) {
          console.error("Failed to complete onboarding:", error);
          if (error instanceof TRPCError) throw error;
          throw new Error("Falha ao completar onboarding. Tente novamente.");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
