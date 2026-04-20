import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../../../drizzle/schema";
import type { TrpcContext } from "../src/core/context";
import {
  createGuardianProfile,
  createSchool,
  createStudentProfile,
  createTeacherProfile,
  createUserSchool,
  linkStudentGuardian,
  resetMemoryStore,
} from "../src/db";
import { appRouter } from "../src/routers";

function makeUser(id: number): User {
  return {
    id,
    openId: `auth-user-${id}`,
    name: `Auth User ${id}`,
    email: `auth-${id}@example.com`,
    loginMethod: "oauth",
    role: "user",
    defaultProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function makeCtx(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("multi-tenant authorization", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("blocks school contacts access for unmanaged schools", async () => {
    const school1 = await createSchool({
      name: "Escola 1",
      email: "escola1@example.com",
      status: "trial",
    });
    const school2 = await createSchool({
      name: "Escola 2",
      email: "escola2@example.com",
      status: "trial",
    });

    await createUserSchool({
      userId: 1,
      schoolId: school1!.id,
      role: "coordinator",
    });

    const caller = appRouter.createCaller(makeCtx(makeUser(1)));

    await expect(
      caller.schools.contacts({ schoolId: school2!.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks guardian from reading non-linked student performance", async () => {
    const school = await createSchool({
      name: "Escola Guardian Auth",
      email: "escola-guardian-auth@example.com",
      status: "trial",
    });

    await createTeacherProfile({
      userId: 900,
      schoolId: school!.id,
      name: "Prof. Auth",
      email: "prof-auth@escola.com",
      subject: "Biologia",
    });

    const linkedStudent = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Vinculado",
    });

    const unlinkedStudent = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Não Vinculado",
    });

    const guardian = await createGuardianProfile({
      userId: 2,
      schoolId: school!.id,
      name: "Responsável 2",
      email: "resp2@example.com",
    });

    await linkStudentGuardian({
      studentId: linkedStudent!.id,
      guardianId: guardian!.id,
      isPrimary: 1,
    });

    const caller = appRouter.createCaller(makeCtx(makeUser(2)));

    await expect(
      caller.profiles.guardian.studentPerformance({
        studentId: unlinkedStudent!.id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
