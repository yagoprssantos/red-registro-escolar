import { createAttendanceRecord } from "../../db";

export class AttendanceService {
  /**
   * Create an attendance record for a student in a class session
   * @param input Attendance record data
   * @returns Created attendance record
   */
  static async createAttendanceRecord(input: {
    classSessionId: number;
    studentId: number;
    status: "present" | "absent" | "justified";
    reason?: string | null;
    recordedByTeacherId: number;
  }) {
    return await createAttendanceRecord(input);
  }
}
