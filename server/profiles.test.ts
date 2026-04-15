import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

type AuthenticatedUser = User;

function createAuthContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

const mockUser: AuthenticatedUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("profiles router", () => {
  describe("teacher", () => {
    it("returns teacher profile data", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profiles.teacher.me();

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("subject");
      expect(result).toHaveProperty("school");
      expect(result).toHaveProperty("classes");
      expect(result).toHaveProperty("students");
    });

    it("returns teacher classes", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const classes = await caller.profiles.teacher.classes();

      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
      expect(classes[0]).toHaveProperty("id");
      expect(classes[0]).toHaveProperty("name");
      expect(classes[0]).toHaveProperty("subject");
      expect(classes[0]).toHaveProperty("students");
    });

    it("throws error when not authenticated", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profiles.teacher.me();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("student", () => {
    it("returns student profile data", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profiles.student.me();

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("grade");
      expect(result).toHaveProperty("school");
      expect(result).toHaveProperty("averageGrade");
      expect(result).toHaveProperty("absences");
    });

    it("returns student grades", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const grades = await caller.profiles.student.grades();

      expect(Array.isArray(grades)).toBe(true);
      if (grades.length > 0) {
        expect(grades[0]).toHaveProperty("subject");
        expect(grades[0]).toHaveProperty("grade");
        expect(grades[0]).toHaveProperty("date");
      }
    });

    it("returns student communications", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const communications = await caller.profiles.student.communications();

      expect(Array.isArray(communications)).toBe(true);
    });

    it("throws error when not authenticated", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profiles.student.me();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("guardian", () => {
    it("returns guardian profile data", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profiles.guardian.me();

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("relationship");
      expect(result).toHaveProperty("students");
    });

    it("returns guardian students", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const students = await caller.profiles.guardian.students();

      expect(Array.isArray(students)).toBe(true);
    });

    it("returns student performance for guardian", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const performance = await caller.profiles.guardian.studentPerformance({
        studentId: 1,
      });

      expect(performance).toHaveProperty("studentId");
      expect(performance).toHaveProperty("grades");
      expect(performance).toHaveProperty("absences");
      expect(performance).toHaveProperty("alerts");
    });

    it("throws error when not authenticated", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profiles.guardian.me();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
