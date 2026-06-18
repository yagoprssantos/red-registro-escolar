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

  const visibilityTypes = ["student", "guardian", "school", "all"] as const;
  type VisibilityType = (typeof visibilityTypes)[number];
  type ViewerType = "student" | "guardian" | "school";

  /**
   * Returns expected visibility based on viewer and comment visibility
   */
  function shouldBeVisible(
    viewer: ViewerType,
    visibility: VisibilityType
  ): boolean {
    if (viewer === "student") {
      return visibility === "student" || visibility === "all";
    }
    if (viewer === "guardian") {
      return visibility === "guardian" || visibility === "all";
    }
    if (viewer === "school") {
      // School can see everything
      return true;
    }
    return false;
  }

  it.each([
    ["student", "student"],
    ["student", "guardian"],
    ["student", "school"],
    ["student", "all"],
    ["guardian", "student"],
    ["guardian", "guardian"],
    ["guardian", "school"],
    ["guardian", "all"],
    ["school", "student"],
    ["school", "guardian"],
    ["school", "school"],
    ["school", "all"],
  ])(
    "viewer %s sees comment with visibility %s: %s",
    async (viewer, visibility, _) => {
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
        visibility: visibility as any, // TypeScript needs this cast
        content: `Comentário com visibilidade ${visibility}`,
      });

      const comments = await getStudentCommentsForViewer(student!.id, viewer);

      const expectedVisible = shouldBeVisible(
        viewer,
        visibility as VisibilityType
      );

      if (expectedVisible) {
        expect(comments.length).toBeGreaterThan(0);
        // For student viewer, author should be null
        if (viewer === "student") {
          expect(comments[0]?.author).toBeNull();
        } else {
          // For guardian/school viewer, author should be visible
          expect(comments[0]?.author).toBe("Professor Autor");
        }
        expect(comments[0]?.content).toBe(
          `Comentário com visibilidade ${visibility}`
        );
      } else {
        expect(comments.length).toBe(0);
      }
    }
  );

  it("handles multiple comments with different visibilities", async () => {
    const school = await createSchool({
      name: "Escola Multi Visibility",
      email: "multi@example.com",
      status: "trial",
    });

    const teacher = await createTeacherProfile({
      userId: 101,
      schoolId: school!.id,
      name: "Professor Multi",
      email: "multi@escola.com",
      subject: "Historia",
    });

    const student = await createStudentProfile({
      schoolId: school!.id,
      name: "Aluno Multi",
    });

    // Create comments with different visibilities
    await createStudentComment({
      schoolId: school!.id,
      studentId: student!.id,
      teacherId: teacher!.id,
      category: "elogio",
      visibility: "student",
      content: "Só o aluno deve ver",
    });

    await createStudentComment({
      schoolId: school!.id,
      studentId: student!.id,
      teacherId: teacher!.id,
      category: "melhoria",
      visibility: "guardian",
      content: "Só o responsável deve ver",
    });

    await createStudentComment({
      schoolId: school!.id,
      studentId: student!.id,
      teacherId: teacher!.id,
      category: "ocorrencia",
      visibility: "school",
      content: "Só a escola deve ver",
    });

    await createStudentComment({
      schoolId: school!.id,
      studentId: student!.id,
      teacherId: teacher!.id,
      category: "comentario",
      visibility: "all",
      content: "Todos devem ver",
    });

    // Test student viewer - should see student and all comments
    const studentComments = await getStudentCommentsForViewer(
      student!.id,
      "student"
    );
    expect(studentComments.length).toBe(2);
    expect(studentComments.map(c => c.content)).toContain(
      "Só o aluno deve ver"
    );
    expect(studentComments.map(c => c.content)).toContain("Todos devem ver");
    expect(studentComments.map(c => c.author)).toEqual([null, null]); // authors hidden for student

    // Test guardian viewer - should see guardian and all comments
    const guardianComments = await getStudentCommentsForViewer(
      student!.id,
      "guardian"
    );
    expect(guardianComments.length).toBe(2);
    expect(guardianComments.map(c => c.content)).toContain(
      "Só o responsável deve ver"
    );
    expect(guardianComments.map(c => c.content)).toContain("Todos devem ver");
    expect(guardianComments.map(c => c.author)).toEqual([
      "Professor Multi",
      "Professor Multi",
    ]); // authors visible for guardian

    // Test school viewer - should see all comments
    const schoolComments = await getStudentCommentsForViewer(
      student!.id,
      "school"
    );
    expect(schoolComments.length).toBe(4);
    expect(schoolComments.map(c => c.content)).toEqual(
      expect.arrayContaining([
        "Só o aluno deve ver",
        "Só o responsável deve ver",
        "Só a escola deve ver",
        "Todos devem ver",
      ])
    );
    expect(schoolComments.map(c => c.author)).toEqual([
      "Professor Multi",
      "Professor Multi",
      "Professor Multi",
      "Professor Multi",
    ]); // authors visible for school
  });
});
