import { describe, expect, it } from "vitest";
import type { User } from "../../../drizzle/schema";
import type { TrpcContext } from "../src/core/context";
import { appRouter } from "../src/routers";

function createAuthContext(): { ctx: TrpcContext } {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "oauth",
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
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("onboarding.complete", () => {
  it("should complete onboarding with existing school", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.complete({
      personalData: {
        name: "João Silva",
        email: "joao@example.com",
        phone: "(11) 99999-9999",
      },
      schoolData: {
        schoolId: 1,
        isNewSchool: false,
      },
      professionalData: {
        position: "teacher",
        subject: "Matemática",
      },
    });

    expect(result).toEqual({
      success: true,
      message: "Onboarding concluído com sucesso",
    });
  });

  it("should complete onboarding with new school", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.complete({
      personalData: {
        name: "Maria Santos",
        email: "maria@example.com",
        phone: "(11) 88888-8888",
      },
      schoolData: {
        schoolName: "Escola Nova",
        schoolCity: "São Paulo",
        isNewSchool: true,
      },
      professionalData: {
        position: "admin",
      },
    });

    expect(result).toEqual({
      success: true,
      message: "Onboarding concluído com sucesso",
    });
  });

  it("should complete onboarding for guardian", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.complete({
      personalData: {
        name: "Pedro Oliveira",
        email: "pedro@example.com",
        phone: "(11) 77777-7777",
      },
      schoolData: {
        schoolId: 1,
        isNewSchool: false,
      },
      professionalData: {
        position: "guardian",
        grade: "6º ano",
      },
    });

    expect(result).toEqual({
      success: true,
      message: "Onboarding concluído com sucesso",
    });
  });

  it("should fail if user is not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.onboarding.complete({
        personalData: {
          name: "Test",
          email: "test@example.com",
          phone: "123456",
        },
        schoolData: {
          schoolId: 1,
          isNewSchool: false,
        },
        professionalData: {
          position: "teacher",
          subject: "Math",
        },
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Please login");
    }
  });
});


