import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../../../drizzle/schema";
import type { TrpcContext } from "../src/core/context";
import {
  createGuardianProfile,
  createSchool,
  createStudentProfile,
  createTeacherProfile,
  linkStudentGuardian,
  resetMemoryStore,
} from "../src/db";
import { appRouter } from "../src/routers";

function createUser(id: number): User {
  return {
    id,
    openId: `test-user-${id}`,
    email: `test-${id}@example.com`,
    name: `Test User ${id}`,
    loginMethod: "oauth",
    role: "user",
    defaultProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function createAuthContext(user: User): TrpcContext {
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

describe("profiles router", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  describe("teacher", () => {
    it("returns teacher profile data", async () => {
      const user = createUser(1);
      const school = await createSchool({
        name: "Escola Teste",
        email: "escola-teste@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: user.id,
        schoolId: school!.id,
        name: "Prof. João",
        email: "joao@escola.com",
        subject: "Matemática",
      });

      const caller = appRouter.createCaller(createAuthContext(user));
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
      const user = createUser(2);
      const school = await createSchool({
        name: "Escola Classes",
        email: "escola-classes@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: user.id,
        schoolId: school!.id,
        name: "Prof. Ana",
        email: "ana@escola.com",
        subject: "Português",
      });

      const caller = appRouter.createCaller(createAuthContext(user));
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

      await expect(caller.profiles.teacher.me()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  describe("student", () => {
    it("returns student profile data", async () => {
      const teacherUser = createUser(10);
      const studentUser = createUser(11);

      const school = await createSchool({
        name: "Escola Aluno",
        email: "escola-aluno@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: teacherUser.id,
        schoolId: school!.id,
        name: "Prof. Base",
        email: "base@escola.com",
        subject: "Ciências",
      });

      await createStudentProfile({
        schoolId: school!.id,
        userId: studentUser.id,
        name: "Aluno Teste",
        grade: "6o Ano A",
      });

      const caller = appRouter.createCaller(createAuthContext(studentUser));
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
      const teacherUser = createUser(20);
      const studentUser = createUser(21);

      const school = await createSchool({
        name: "Escola Notas",
        email: "escola-notas@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: teacherUser.id,
        schoolId: school!.id,
        name: "Prof. Notas",
        email: "notas@escola.com",
        subject: "História",
      });

      await createStudentProfile({
        schoolId: school!.id,
        userId: studentUser.id,
        name: "Aluno Notas",
      });

      const caller = appRouter.createCaller(createAuthContext(studentUser));
      const grades = await caller.profiles.student.grades();

      expect(Array.isArray(grades)).toBe(true);
      expect(grades.length).toBeGreaterThan(0);
      expect(grades[0]).toHaveProperty("subject");
      expect(grades[0]).toHaveProperty("grade");
      expect(grades[0]).toHaveProperty("date");
    });

    it("returns student communications", async () => {
      const user = createUser(30);
      const school = await createSchool({
        name: "Escola Comunicados",
        email: "escola-comunicados@example.com",
        status: "trial",
      });

      await createStudentProfile({
        schoolId: school!.id,
        userId: user.id,
        name: "Aluno Comunicados",
      });

      const caller = appRouter.createCaller(createAuthContext(user));
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

      await expect(caller.profiles.student.me()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  describe("guardian", () => {
    it("returns guardian profile data", async () => {
      const teacherUser = createUser(40);
      const guardianUser = createUser(41);

      const school = await createSchool({
        name: "Escola Responsável",
        email: "escola-responsavel@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: teacherUser.id,
        schoolId: school!.id,
        name: "Prof. Guardian",
        email: "guardian@escola.com",
        subject: "Geografia",
      });

      const student = await createStudentProfile({
        schoolId: school!.id,
        name: "Aluno Filho",
        grade: "7o Ano A",
      });

      const guardian = await createGuardianProfile({
        userId: guardianUser.id,
        schoolId: school!.id,
        name: "Maria Responsável",
        email: "maria@resp.com",
        relationship: "Mãe",
      });

      await linkStudentGuardian({
        studentId: student!.id,
        guardianId: guardian!.id,
        relationship: "Mãe",
        isPrimary: 1,
      });

      const caller = appRouter.createCaller(createAuthContext(guardianUser));
      const result = await caller.profiles.guardian.me();

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("relationship");
      expect(result).toHaveProperty("students");
    });

    it("returns guardian students", async () => {
      const teacherUser = createUser(50);
      const guardianUser = createUser(51);

      const school = await createSchool({
        name: "Escola Guardian Students",
        email: "escola-guardian-students@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: teacherUser.id,
        schoolId: school!.id,
        name: "Prof. Turma",
        email: "turma@escola.com",
        subject: "Inglês",
      });

      const student = await createStudentProfile({
        schoolId: school!.id,
        name: "Aluno Vinculado",
      });

      const guardian = await createGuardianProfile({
        userId: guardianUser.id,
        schoolId: school!.id,
        name: "Pai Vinculado",
        email: "pai@resp.com",
      });

      await linkStudentGuardian({
        studentId: student!.id,
        guardianId: guardian!.id,
      });

      const caller = appRouter.createCaller(createAuthContext(guardianUser));
      const linkedStudents = await caller.profiles.guardian.students();

      expect(Array.isArray(linkedStudents)).toBe(true);
      expect(linkedStudents.length).toBeGreaterThan(0);
    });

    it("returns student performance for guardian", async () => {
      const teacherUser = createUser(60);
      const guardianUser = createUser(61);

      const school = await createSchool({
        name: "Escola Performance",
        email: "escola-performance@example.com",
        status: "trial",
      });

      await createTeacherProfile({
        userId: teacherUser.id,
        schoolId: school!.id,
        name: "Prof. Performance",
        email: "perf@escola.com",
        subject: "Física",
      });

      const student = await createStudentProfile({
        schoolId: school!.id,
        name: "Aluno Performance",
      });

      const guardian = await createGuardianProfile({
        userId: guardianUser.id,
        schoolId: school!.id,
        name: "Guardião Performance",
        email: "guardiao@resp.com",
      });

      await linkStudentGuardian({
        studentId: student!.id,
        guardianId: guardian!.id,
      });

      const caller = appRouter.createCaller(createAuthContext(guardianUser));
      const performance = await caller.profiles.guardian.studentPerformance({
        studentId: student!.id,
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

      await expect(caller.profiles.guardian.me()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });
});
