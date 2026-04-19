import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../src/routers";
import type { TrpcContext } from "../src/core/context";

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

describe("contacts router", () => {
  it("creates a new contact with valid input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.create({
      name: "João Silva",
      email: "joao@example.com",
      school: "Escola Municipal ABC",
      role: "diretor",
      students: "500-1000",
      message: "Gostaria de conhecer mais sobre o RED",
    });

    expect(result.success).toBe(true);
    expect(result.contact).toBeDefined();
    expect(result.contact?.name).toBe("João Silva");
    expect(result.contact?.email).toBe("joao@example.com");
    expect(result.contact?.status).toBe("novo");
  });

  it("validates email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contacts.create({
        name: "Test User",
        email: "invalid-email",
        school: "Test School",
        role: "professor",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Email inválido");
    }
  });

  it("requires name field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contacts.create({
        name: "",
        email: "test@example.com",
        school: "Test School",
        role: "professor",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Nome é obrigatório");
    }
  });

  it("requires school field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contacts.create({
        name: "Test User",
        email: "test@example.com",
        school: "",
        role: "professor",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Nome da escola é obrigatório");
    }
  });

  it("requires role field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contacts.create({
        name: "Test User",
        email: "test@example.com",
        school: "Test School",
        role: "",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Cargo é obrigatório");
    }
  });

  it("allows optional fields (students and message)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.create({
      name: "Jane Doe",
      email: "jane@example.com",
      school: "Escola Privada XYZ",
      role: "coordenador",
    });

    expect(result.success).toBe(true);
    expect(result.contact?.students).toBeNull();
    expect(result.contact?.message).toBeNull();
  });

  it("lists contacts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Create a contact first
    await caller.contacts.create({
      name: "Contact 1",
      email: "contact1@example.com",
      school: "School 1",
      role: "professor",
    });

    const contacts = await caller.contacts.list();
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts.length).toBeGreaterThan(0);
  });
});


