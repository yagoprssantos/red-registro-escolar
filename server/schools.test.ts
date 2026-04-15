import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

function createAuthenticatedContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("schools router", () => {
  describe("register", () => {
    it("registers a new school with valid input", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.schools.register({
        name: "Escola Municipal ABC",
        email: `school-${Date.now()}@example.com`,
        phone: "(11) 3000-0000",
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        studentCount: 500,
      });

      expect(result.success).toBe(true);
      expect(result.school).toBeDefined();
      expect(result.school?.name).toBe("Escola Municipal ABC");
      expect(result.school?.status).toBe("trial");
    });

    it("validates email format", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.schools.register({
          name: "Test School",
          email: "invalid-email",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Email inválido");
      }
    });

    it("requires school name", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.schools.register({
          name: "",
          email: "test@example.com",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Nome da escola é obrigatório");
      }
    });

    it("prevents duplicate school emails", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `unique-${Date.now()}@example.com`;

      // Register first school
      await caller.schools.register({
        name: "School 1",
        email,
      });

      // Try to register with same email
      try {
        await caller.schools.register({
          name: "School 2",
          email,
        });
        expect.fail("Should have thrown conflict error");
      } catch (error: any) {
        expect(error.message).toContain("já está registrada");
      }
    });
  });

  describe("mySchools", () => {
    it("requires authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.schools.mySchools();
        expect.fail("Should have thrown unauthorized error");
      } catch (error: any) {
        expect(error.message).toContain("Please login");
      }
    });

    it("returns empty array for user with no schools", async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const schools = await caller.schools.mySchools();
      expect(Array.isArray(schools)).toBe(true);
      expect(schools.length).toBe(0);
    });
  });

  describe("contacts", () => {
    it("requires authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.schools.contacts({ schoolId: 1 });
        expect.fail("Should have thrown unauthorized error");
      } catch (error: any) {
        expect(error.message).toContain("Please login");
      }
    });

    it("prevents access to schools user doesn't manage", async () => {
      const ctx = createAuthenticatedContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.schools.contacts({ schoolId: 999 });
        expect.fail("Should have thrown forbidden error");
      } catch (error: any) {
        expect(error.message).toContain("Você não tem acesso");
      }
    });
  });
});
