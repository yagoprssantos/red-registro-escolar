import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../src/db";
import type { TrpcContext } from "../src/core/context";
import { TRPCError } from "@trpc/server";
import {
  createSchool,
  createStudentProfile,
  createTeacherProfile,
  createAttendanceRecord,
  resetMemoryStore,
  getClassSessionById,
  isStudentEnrolledInClass,
  isTeacherOfClassSubject,
  attendanceRecordExists,
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

describe("attendance validations", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("rejects attendance for future date", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "e@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "p@e.com",
      subject: "Mat",
    });
    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno",
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

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
    const session = await createEntityRow("classSessions", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      lessonDate: futureDate.toISOString().split("T")[0],
      lessonNumber: 1,
      topic: "Future class",
      notes: null,
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    await expect(
      caller.attendance.create({
        classSessionId: session!.id,
        studentId: student!.id,
        status: "present",
      })
    ).rejects.toThrow("Não é possível registrar chamada para data futura");
  });

  it("rejects attendance when teacher does not own the session", async () => {
    const teacherA = createUser({ id: 1, role: "teacher" });
    const teacherB = createUser({ id: 2, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "e2@e.com",
      status: "trial",
    });
    const profA = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof A",
      email: "a@e.com",
      subject: "Mat",
    });
    const profB = await createTeacherProfile({
      userId: 2,
      schoolId: school!.id,
      name: "Prof B",
      email: "b@e.com",
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
    const session = await createEntityRow("classSessions", {
      classSubjectId: cs!.id,
      teacherId: profA!.id, // Session belongs to Teacher A
      lessonDate: new Date().toISOString().split("T")[0],
      lessonNumber: 1,
      topic: "Topic",
      notes: null,
    });

    // Teacher B tries to record attendance on Teacher A's session
    const caller = appRouter.createCaller(createAuthContext(teacherB));

    await expect(
      caller.attendance.create({
        classSessionId: session!.id,
        studentId: student!.id,
        status: "present",
      })
    ).rejects.toThrow("Você não é o professor desta sessão");
  });

  it("rejects duplicate attendance record for same student/session", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "e3@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "p3@e.com",
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
    const session = await createEntityRow("classSessions", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      lessonDate: new Date().toISOString().split("T")[0],
      lessonNumber: 1,
      topic: "Topic",
      notes: null,
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    // First record: succeeds
    await caller.attendance.create({
      classSessionId: session!.id,
      studentId: student!.id,
      status: "present",
    });

    // Duplicate: fails
    await expect(
      caller.attendance.create({
        classSessionId: session!.id,
        studentId: student!.id,
        status: "absent",
      })
    ).rejects.toThrow("Chamada já registrada para este aluno nesta sessão");
  });

  it("rejects attendance for unenrolled student", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "e4@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "p4@e.com",
      subject: "Mat",
    });

    // Enrolled student (in classId 100)
    const enrolledStudent = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Matriculado",
    });
    // Unenrolled student
    const unenrolledStudent = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Nao Matriculado",
    });

    const { createEntityRow } = await import("../src/db");
    // Create a real class and link everything
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
    // Only enrolledStudent is enrolled
    await createEntityRow("classEnrollments", {
      classId: classRow!.id,
      studentId: enrolledStudent!.id,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ativo",
    });
    // unenrolledStudent has NO enrollment
    const session = await createEntityRow("classSessions", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      lessonDate: new Date().toISOString().split("T")[0],
      lessonNumber: 1,
      topic: "Topic",
      notes: null,
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    await expect(
      caller.attendance.create({
        classSessionId: session!.id,
        studentId: unenrolledStudent!.id,
        status: "present",
      })
    ).rejects.toThrow("Aluno não está matriculado nesta turma");
  });

  it("allows valid attendance creation", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    const school = await createSchool({
      name: "Escola",
      email: "e5@e.com",
      status: "trial",
    });
    const teacher = await createTeacherProfile({
      userId: 1,
      schoolId: school!.id,
      name: "Prof",
      email: "p5@e.com",
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
    const session = await createEntityRow("classSessions", {
      classSubjectId: cs!.id,
      teacherId: teacher!.id,
      lessonDate: new Date().toISOString().split("T")[0],
      lessonNumber: 1,
      topic: "Topic",
      notes: null,
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    const result = await caller.attendance.create({
      classSessionId: session!.id,
      studentId: student!.id,
      status: "present",
    });

    expect(result.success).toBe(true);
    expect(result.attendance.status).toBe("present");
  });

  it("rejects non-teacher from creating attendance", async () => {
    const studentUser = createUser({ id: 10, role: "student" });
    const school = await createSchool({
      name: "Escola",
      email: "e6@e.com",
      status: "trial",
    });
    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno",
    });

    const caller = appRouter.createCaller(createAuthContext(studentUser));

    await expect(
      caller.attendance.create({
        classSessionId: 1,
        studentId: student!.id,
        status: "present",
      })
    ).rejects.toThrow("Apenas professores podem registrar chamada");
  });

  it("rejects attendance for nonexistent session", async () => {
    const teacherUser = createUser({ id: 1, role: "teacher" });
    await createSchool({ name: "Escola", email: "e7@e.com", status: "trial" });
    await createTeacherProfile({
      userId: 1,
      schoolId: 1,
      name: "Prof",
      email: "p7@e.com",
      subject: "Mat",
    });

    const caller = appRouter.createCaller(createAuthContext(teacherUser));

    await expect(
      caller.attendance.create({
        classSessionId: 9999,
        studentId: 1,
        status: "present",
      })
    ).rejects.toThrow("Sessão de aula não encontrada");
  });
});
