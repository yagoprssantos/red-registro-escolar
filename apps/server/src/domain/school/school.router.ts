import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import {
  getEntityById,
  getUserManagedSchoolIds,
  listEntityRows,
} from "../../db";

export const schoolRouter = router({
  // School dashboard with real metrics
  dashboard: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        date: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }

      const today = input.date || new Date().toISOString().split("T")[0];

      // 1. Attendance today
      const sessions = await listEntityRows("classSessions", {
        filters: { lessonDate: today },
        limit: 500,
      });
      const sessionIds = sessions.map(
        (s: Record<string, unknown>) => s.id as number
      );

      let presentCount = 0;
      let absentCount = 0;
      let totalExpected = 0;

      if (sessionIds.length > 0) {
        const records = await listEntityRows("attendanceRecords", {
          limit: 2000,
        });
        for (const r of records) {
          const rr = r as Record<string, unknown>;
          if (sessionIds.includes(rr.classSessionId as number)) {
            totalExpected++;
            if (rr.status === "present") presentCount++;
            else if (rr.status === "absent") absentCount++;
          }
        }
      }

      const attendanceToday = {
        presentCount,
        absentCount,
        totalExpected: totalExpected || 1,
        percentage:
          totalExpected > 0
            ? Math.round((presentCount / totalExpected) * 100)
            : 0,
      };

      // 2. Students at risk (>25% absence rate)
      const enrollments = await listEntityRows("classEnrollments", {
        filters: { status: "ativo" },
        limit: 500,
      });
      const schoolEnrollmentIds = new Set<number>();

      // Filter enrollments by school
      for (const e of enrollments) {
        const er = e as Record<string, unknown>;
        const classId = er.classId as number;
        const cls = await getEntityById("classes", classId);
        if (
          cls &&
          (cls as Record<string, unknown>).schoolId === input.schoolId
        ) {
          schoolEnrollmentIds.add(er.studentId as number);
        }
      }

      const studentsAtRisk: Array<{
        studentId: number;
        studentName: string;
        className: string;
        absenceRate: number;
        totalAbsences: number;
      }> = [];

      // Get all attendance records for these students
      const allRecords = await listEntityRows("attendanceRecords", {
        limit: 5000,
      });
      const studentAbsences: Record<
        number,
        { total: number; absences: number }
      > = {};

      for (const r of allRecords) {
        const rr = r as Record<string, unknown>;
        const studentId = rr.studentId as number;
        if (schoolEnrollmentIds.has(studentId)) {
          if (!studentAbsences[studentId])
            studentAbsences[studentId] = { total: 0, absences: 0 };
          studentAbsences[studentId].total++;
          if (rr.status === "absent") studentAbsences[studentId].absences++;
        }
      }

      for (const [studentIdStr, data] of Object.entries(studentAbsences)) {
        const studentId = Number(studentIdStr);
        const rate = data.total > 0 ? data.absences / data.total : 0;
        if (rate > 0.25) {
          const student = await getEntityById("students", studentId);
          const studentName = student
            ? ((student as Record<string, unknown>).name as string)
            : "Desconhecido";
          // Find class
          const studentEnrollments = enrollments.filter(
            (e: Record<string, unknown>) =>
              (e.studentId as number) === studentId
          );
          const className =
            studentEnrollments.length > 0
              ? ((
                  (await getEntityById(
                    "classes",
                    (studentEnrollments[0] as Record<string, unknown>)
                      .classId as number
                  )) as Record<string, unknown>
                )?.name as string) || "?"
              : "?";

          studentsAtRisk.push({
            studentId,
            studentName,
            className,
            absenceRate: Math.round(rate * 100),
            totalAbsences: data.absences,
          });
        }
      }

      // 3. Pending justifications
      const justifications = await listEntityRows("absenceJustifications", {
        filters: { schoolId: input.schoolId, status: "pending" },
        limit: 100,
      });
      const pendingJustifications = justifications.length;

      // 4. Upcoming events
      const events = await listEntityRows("schoolEvents", {
        filters: { schoolId: input.schoolId },
        limit: 10,
        orderBy: "startsAt",
        orderDirection: "asc",
      });
      const upcomingEvents = events
        .slice(0, 5)
        .map((e: Record<string, unknown>) => ({
          eventId: e.id,
          title: e.title,
          startsAt: e.startsAt,
          eventType: e.eventType,
        }));

      return {
        attendanceToday,
        studentsAtRisk: studentsAtRisk.slice(0, 10),
        pendingJustifications,
        upcomingEvents,
      };
    }),

  // Attendance report
  attendanceReport: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        classId: z.number().int().positive().optional(),
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }

      const records = await listEntityRows("attendanceRecords", {
        limit: 5000,
      });
      return { totalRecords: records.length, records };
    }),

  // Grades report
  gradesReport: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        classId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.user ||
        (ctx.user.role !== "admin" && ctx.user.role !== "school_staff")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso restrito à gestão escolar",
        });
      }

      const scores = await listEntityRows("assessmentScores", { limit: 5000 });

      // Calculate average
      const validScores = scores
        .map((s: Record<string, unknown>) => Number(s.score || 0))
        .filter((s: number) => Number.isFinite(s));
      const averageScore =
        validScores.length > 0
          ? (
              validScores.reduce((a: number, b: number) => a + b, 0) /
              validScores.length
            ).toFixed(1)
          : "—";

      return { totalScores: scores.length, scores, averageScore };
    }),

  // LGPD Export — student data (Art. 18)
  exportStudentData: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        studentId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // Verify access: guardian linked to the student OR school staff
      let hasAccess = false;

      if (user.role === "admin" || user.role === "school_staff") {
        const managedSchools = await getUserManagedSchoolIds(user.id);
        hasAccess = managedSchools.includes(input.schoolId);
      } else if (user.role === "guardian") {
        // Verify guardian is linked to this student
        const links = await listEntityRows("studentGuardians", {
          filters: { studentId: input.studentId },
          limit: 50,
        });
        const guardianProfile = await listEntityRows("guardians", {
          filters: { userId: user.id },
          limit: 1,
        });
        if (guardianProfile.length > 0) {
          const guardianId = (guardianProfile[0] as Record<string, unknown>)
            .id as number;
          hasAccess = links.some(
            (l: Record<string, unknown>) =>
              (l.guardianId as number) === guardianId
          );
        }
      }

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado a dados deste aluno",
        });
      }

      // Gather student data
      const student = await getEntityById("students", input.studentId);
      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aluno não encontrado",
        });
      }
      const studentRec = student as Record<string, unknown>;

      // Enrollments
      const enrollments = (await listEntityRows("classEnrollments", {
        filters: { studentId: input.studentId },
        limit: 100,
      })) as Record<string, unknown>[];

      // Attendance records
      const attendanceRecords = (await listEntityRows("attendanceRecords", {
        limit: 5000,
      })) as Record<string, unknown>[];
      const studentAttendance = attendanceRecords.filter(
        r => (r.studentId as number) === input.studentId
      );

      // Grade scores
      const assessmentScores = (await listEntityRows("assessmentScores", {
        limit: 5000,
      })) as Record<string, unknown>[];
      const studentGrades = assessmentScores.filter(
        s => (s.studentId as number) === input.studentId
      );

      // Comments
      const comments = (await listEntityRows("studentComments", {
        filters: { studentId: input.studentId },
        limit: 500,
      })) as Record<string, unknown>[];

      // Guardian data of requester
      const guardianLinks = (await listEntityRows("studentGuardians", {
        filters: { studentId: input.studentId },
        limit: 10,
      })) as Record<string, unknown>[];

      const guardianDetails = [];
      for (const link of guardianLinks) {
        const guardian = await getEntityById(
          "guardians",
          link.guardianId as number
        );
        if (guardian) guardianDetails.push(guardian);
      }

      // Audit this access
      try {
        const { AuditService } = await import("../audit/audit.service");
        await AuditService.log({
          userId: user.id,
          action: "export",
          entity: "student_data",
          entityId: input.studentId,
          schoolId: input.schoolId,
        });
      } catch {
        /* non-critical */
      }

      return {
        student: studentRec,
        enrollments,
        attendance: studentAttendance,
        grades: studentGrades,
        comments,
        guardians: guardianDetails,
        exportDate: new Date().toISOString(),
        requestedBy: user.name || `User #${user.id}`,
      };
    }),
});
