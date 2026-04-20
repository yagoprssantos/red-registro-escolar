import { beforeEach, describe, expect, it } from "vitest";
import {
  createSchool,
  createStudentComment,
  createStudentProfile,
  createTeacherProfile,
  getStudentCommentsForViewer,
  resetMemoryStore,
} from "../src/db";

describe("visibility rules", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("hides teacher author for student viewer", async () => {
    const school = await createSchool({
      name: "Escola Visibilidade",
      email: "visibilidade@example.com",
      status: "trial",
    });

    const teacher = await createTeacherProfile({
      userId: 101,
      schoolId: school!.id,
      name: "Professor Autor",
      email: "autor@escola.com",
      subject: "Artes",
    });

    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Comentário",
    });

    await createStudentComment({
      schoolId: school!.id,
      studentId: student!.id,
      teacherId: teacher!.id,
      category: "comentario",
      content: "Participou muito bem da aula.",
    });

    const asStudent = await getStudentCommentsForViewer(student!.id, "student");
    const asGuardian = await getStudentCommentsForViewer(
      student!.id,
      "guardian"
    );

    expect(asStudent.length).toBeGreaterThan(0);
    expect(asStudent[0]?.author).toBeNull();

    expect(asGuardian.length).toBeGreaterThan(0);
    expect(asGuardian[0]?.author).toBe("Professor Autor");
  });
});
