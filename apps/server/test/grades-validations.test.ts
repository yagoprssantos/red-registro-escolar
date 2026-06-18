import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../src/db";
import type { TrpcContext } from "../src/core/context";
import {
  createSchool,
  createStudentProfile,
  createTeacherProfile,
  resetMemoryStore,
} from "../src/db";
import { appRouter } from "../src/routers";

function createUser(overrides: Partial<User> & { id: number }): User {
  return {
    openId: `test-user-${overrides.id}`,
    email: `test-${overrides.id}@example.com`,
    name: `Test User ${overrides.id}`,
    loginMethod: "oauth",
    role: "user",
    defaultProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createAuthContext(user: User): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("grades validations", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("rejects score exceeding maxScore", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "g1@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "g1p@e.com",
      subject: "Mat",
    });
    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno",
    });

    const { createEntityRow } = await import("../src/db");
    const classRow = await createEntityRow("classes", {
      schoolId: school!.id,
      schoolYearId: 1,
      name: "6A",
      gradeLabel: "6o",
      shift: "morning",
      status: "ativo",
    });
    const cs = await createEntityRow("classSubjects", {
      classId: classRow!.id,
      subjectId: 1,
    });
    await createEntityRow("classTeachers", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
    });
    await createEntityRow("classEnrollments", {
      classId: classRow!.id,
      studentId: student!.id,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ativo",
    });

    // Create assessment with maxScore = 10
    const assessment = await createEntityRow("assessments", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      title: "Prova 1",
      description: null,
      maxScore: "10",
      weight: "1",
      assessmentDate: new Date().toISOString().split("T")[0],
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    await expect(
      caller.grades.create({
        assessmentId: assessment!.id,
        studentId: student!.id,
        score: 11, // exceeds maxScore of 10
      })
    ).rejects.toThrow("Nota excede o valor máximo da avaliação (max: 10)");
  });

  it("rejects score for nonexistent assessment", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    await createSchool({ name: "Escola", email: "g2@e.com", status: "trial" });
    await createTeacherProfile({
      userId: 1,
      schoolId: 1,
      name: "Prof",
      email: "g2p@e.com",
      subject: "Mat",
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    await expect(
      caller.grades.create({
        assessmentId: 9999,
        studentId: 1,
        score: 8,
      })
    ).rejects.toThrow("Avaliação não encontrada");
  });

  it("rejects grade from teacher who does not own the assessment", async () => {
    const teacherA = createUser({ id: 1, role: "teacher" });
    const teacherB = createUser({ id: 2, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "g3@e.com",
      status: "trial",
    });
    const profA = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof A",
      email: "ga@e.com",
      subject: "Mat",
    });
    const profB = await createTeacherProfile({
      userId: 2,
      schoolId: school!.id,
      name: "Prof B",
      email: "gb@e.com",
      subject: "Por",
    });
    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno",
    });

    const { createEntityRow } = await import("../src/db");
    const classRow = await createEntityRow("classes", {
      schoolId: school!.id,
      schoolYearId: 1,
      name: "6A",
      gradeLabel: "6o",
      shift: "morning",
      status: "ativo",
    });
    const cs = await createEntityRow("classSubjects", {
      classId: classRow!.id,
      subjectId: 1,
    });
    await createEntityRow("classTeachers", {
      classSubjectId: cs!.id,
      teacherId: profA!.id,
    });
    await createEntityRow("classEnrollments", {
      classId: classRow!.id,
      studentId: student!.id,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ativo",
    });

    const assessment = await createEntityRow("assessments", {
      classSubjectId: cs!.id,
      teacherId: profA!.id, // Owned by Teacher A
      title: "Prova 1",
      description: null,
      maxScore: "10",
      weight: "1",
      assessmentDate: new Date().toISOString().split("T")[0],
    });

    // Teacher B tries to grade Teacher A's assessment
    const caller = appRouter.createCaller(createAuthContext(teacherB));

    await expect(
      caller.grades.create({
        assessmentId: assessment!.id,
        studentId: student!.id,
        score: 8,
      })
    ).rejects.toThrow("Você não é o professor desta avaliação");
  });

  it("rejects grade for unenrolled student", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "g4@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "g4p@e.com",
      subject: "Mat",
    });

    const enrolledStudent = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Matriculado",
    });
    const unenrolledStudent = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Nao Matriculado",
    });

    const { createEntityRow } = await import("../src/db");
    const classRow = await createEntityRow("classes", {
      schoolId: school!.id,
      schoolYearId: 1,
      name: "6A",
      gradeLabel: "6o",
      shift: "morning",
      status: "ativo",
    });
    const cs = await createEntityRow("classSubjects", {
      classId: classRow!.id,
      subjectId: 1,
    });
    await createEntityRow("classTeachers", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
    });
    await createEntityRow("classEnrollments", {
      classId: classRow!.id,
      studentId: enrolledStudent!.id,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ativo",
    });

    const assessment = await createEntityRow("assessments", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      title: "Prova 1",
      description: null,
      maxScore: "10",
      weight: "1",
      assessmentDate: new Date().toISOString().split("T")[0],
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    await expect(
      caller.grades.create({
        assessmentId: assessment!.id,
        studentId: unenrolledStudent!.id,
        score: 7,
      })
    ).rejects.toThrow("Aluno não está matriculado nesta turma");
  });

  it("allows valid grade creation", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "g5@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "g5p@e.com",
      subject: "Mat",
    });
    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno",
    });

    const { createEntityRow } = await import("../src/db");
    const classRow = await createEntityRow("classes", {
      schoolId: school!.id,
      schoolYearId: 1,
      name: "6A",
      gradeLabel: "6o",
      shift: "morning",
      status: "ativo",
    });
    const cs = await createEntityRow("classSubjects", {
      classId: classRow!.id,
      subjectId: 1,
    });
    await createEntityRow("classTeachers", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
    });
    await createEntityRow("classEnrollments", {
      classId: classRow!.id,
      studentId: student!.id,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ativo",
    });

    const assessment = await createEntityRow("assessments", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      title: "Prova 1",
      description: null,
      maxScore: "10",
      weight: "1",
      assessmentDate: new Date().toISOString().split("T")[0],
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    const result = await caller.grades.create({
      assessmentId: assessment!.id,
      studentId: student!.id,
      score: 8,
    });

    expect(result.success).toBe(true);
    expect(parseFloat(String(result.score.score))).toBe(8);
  });

  it("allows grade equal to maxScore", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "g6@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "g6p@e.com",
      subject: "Mat",
    });
    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno",
    });

    const { createEntityRow } = await import("../src/db");
    const classRow = await createEntityRow("classes", {
      schoolId: school!.id,
      schoolYearId: 1,
      name: "6A",
      gradeLabel: "6o",
      shift: "morning",
      status: "ativo",
    });
    const cs = await createEntityRow("classSubjects", {
      classId: classRow!.id,
      subjectId: 1,
    });
    await createEntityRow("classTeachers", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
    });
    await createEntityRow("classEnrollments", {
      classId: classRow!.id,
      studentId: student!.id,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ativo",
    });

    const assessment = await createEntityRow("assessments", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      title: "Prova 1",
      description: null,
      maxScore: "10",
      weight: "1",
      assessmentDate: new Date().toISOString().split("T")[0],
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    const result = await caller.grades.create({
      assessmentId: assessment!.id,
      studentId: student!.id,
      score: 10, // exactly maxScore
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-teacher from creating grades", async () => {
    const studentUser = createUser({ id: 10, role: "student" });
    await createSchool({ name: "Escola", email: "g7@e.com", status: "trial" });

    const caller = appRouter.createCaller(createAuthContext(studentUser));

    await expect(
      caller.grades.create({
        assessmentId: 1,
        studentId: 1,
        score: 8,
      })
    ).rejects.toThrow("Apenas professores podem lançar notas");
  });
});
