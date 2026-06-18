import { getCommentsByTeacher, getStudentCommentsForViewer } from "../../db";

export class CommentsService {
  /**
   * Get comments for a student based on viewer's role and visibility rules
   * @param studentId The ID of the student
   * @param viewer The role of the viewer ("student", "guardian", or "school")
   * @returns Array of comments visible to the viewer
   */
  static async getForStudent(
    studentId: number,
    viewer: "student" | "guardian" | "school"
  ) {
    return await getStudentCommentsForViewer(studentId, viewer);
  }

  /**
   * Get all comments made by a specific teacher (teacher's comment history)
   * @param teacherId The ID of the teacher
   * @returns Array of comments made by the teacher
   */
  static async getByTeacher(teacherId: number) {
    return await getCommentsByTeacher(teacherId);
  }
}
