import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../../../drizzle/schema";
import type { TrpcContext } from "../src/core/context";
import {
  createSchool,
  createUserSchool,
  resetMemoryStore,
  upsertUser,
} from "../src/db";
import { appRouter } from "../src/routers";

function makeUser(id: number, role: User["role"] = "user"): User {
  return {
    id,
    openId: `registry-user-${id}`,
    email: `registry-${id}@example.com`,
    name: `Registry User ${id}`,
    loginMethod: "oauth",
    role,
    defaultProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function makeCtx(user: User): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("registry router", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("supports school-scoped CRUD for managed school", async () => {
    const user = makeUser(1);
    await upsertUser({
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      loginMethod: user.loginMethod,
    });

    const school = await createSchool({
      name: "Escola Registry CRUD",
      email: "registry-crud@example.com",
      status: "trial",
    });

    await createUserSchool({
      userId: user.id,
      schoolId: school!.id,
      role: "coordinator",
    });

    const caller = appRouter.createCaller(makeCtx(user));

    const created = (await caller.registry.create({
      entity: "subjects",
      data: {
        schoolId: school!.id,
        name: "Matematica",
        code: "MAT",
      },
    })) as Record<string, unknown>;

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Matematica");

    const updated = (await caller.registry.update({
      entity: "subjects",
      id: Number(created.id),
      data: {
        description: "Disciplina principal",
      },
    })) as Record<string, unknown>;

    expect(updated.description).toBe("Disciplina principal");

    const listed = await caller.registry.list({
      entity: "subjects",
      filters: { schoolId: school!.id },
      limit: 50,
      offset: 0,
      orderDirection: "desc",
    });

    expect(Array.isArray(listed)).toBe(true);
    expect(listed.length).toBeGreaterThan(0);

    const removed = await caller.registry.remove({
      entity: "subjects",
      id: Number(created.id),
    });

    expect(removed.success).toBe(true);
  });

  it("blocks access to records from another school", async () => {
    const manager = makeUser(10);
    const outsider = makeUser(11);

    await upsertUser({
      openId: manager.openId,
      name: manager.name,
      email: manager.email,
      role: manager.role,
      loginMethod: manager.loginMethod,
    });

    await upsertUser({
      openId: outsider.openId,
      name: outsider.name,
      email: outsider.email,
      role: outsider.role,
      loginMethod: outsider.loginMethod,
    });

    const school = await createSchool({
      name: "Escola Registry Auth",
      email: "registry-auth@example.com",
      status: "trial",
    });

    await createUserSchool({
      userId: manager.id,
      schoolId: school!.id,
      role: "coordinator",
    });

    const managerCaller = appRouter.createCaller(makeCtx(manager));
    const outsiderCaller = appRouter.createCaller(makeCtx(outsider));

    const created = (await managerCaller.registry.create({
      entity: "subjects",
      data: {
        schoolId: school!.id,
        name: "Historia",
      },
    })) as Record<string, unknown>;

    await expect(
      outsiderCaller.registry.byId({
        entity: "subjects",
        id: Number(created.id),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("provides user-only notification operations", async () => {
    const user = makeUser(1);
    await upsertUser({
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      loginMethod: user.loginMethod,
    });

    const caller = appRouter.createCaller(makeCtx(user));

    const created = (await caller.registry.create({
      entity: "notifications",
      data: {
        userId: user.id,
        title: "Nova nota",
        body: "Sua nota foi publicada",
        notificationType: "grade_published",
      },
    })) as Record<string, unknown>;

    expect(created.id).toBeDefined();

    const mine = await caller.registry.notifications.mine({
      unreadOnly: true,
      limit: 20,
      offset: 0,
    });

    expect(mine.length).toBe(1);

    await caller.registry.notifications.markRead({
      id: Number(created.id),
    });

    const unreadAfter = await caller.registry.notifications.mine({
      unreadOnly: true,
      limit: 20,
      offset: 0,
    });

    expect(unreadAfter.length).toBe(0);
  });
});
