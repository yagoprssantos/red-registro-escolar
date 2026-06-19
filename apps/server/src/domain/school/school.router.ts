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

      // 1. Load all classes for this school (base for all subsequent queries)
      const schoolClasses = await listEntityRows("classes", {
        filters: { schoolId: input.schoolId },
        limit: 500,
      });
      const classIds = schoolClasses.map(
        (c: Record<string, unknown>) => c.id as number
      );

      const emptyResult = {
        attendanceToday: { presentCount: 0, absentCount: 0, totalExpected: 0, percentage: 0 },
        studentsAtRisk: [],
        pendingJustifications: 0,
        upcomingEvents: [],
      };

      if (classIds.length === 0) return emptyResult;

      // 2. Get enrollments (used both for attendance metric and at-risk students)
      const enrollments = await listEntityRows("classEnrollments", {
        filters: { classId: classIds },
        limit: 2000,
      });
      const totalEnrolled = enrollments.length;

      // 3. Get classSubjects for those classes
      const classSubjects = await listEntityRows("classSubjects", {
        filters: { classId: classIds },
        limit: 1000,
      });
      const csIds = classSubjects.map(
        (cs: Record<string, unknown>) => cs.id as number
      );

      // 4. Attendance today — sessions for today filtered by school's classSubjects
      let presentCount = 0;
      let absentCount = 0;

      if (csIds.length > 0) {
        const sessions = await listEntityRows("classSessions", {
          filters: { lessonDate: today, classSubjectId: csIds },
          limit: 500,
        });
        const sessionIds = sessions.map(
          (s: Record<string, unknown>) => s.id as number
        );

        if (sessionIds.length > 0) {
          const records = await listEntityRows("attendanceRecords", {
            filters: { classSessionId: sessionIds },
            limit: 5000,
          });
          const seenStudents = new Set<number>();
          for (const r of records) {
            const rr = r as Record<string, unknown>;
            const sid = rr.studentId as number;
            if (!seenStudents.has(sid)) {
              seenStudents.add(sid);
              if (rr.status === "present") presentCount++;
              else if (rr.status === "absent") absentCount++;
            }
          }
        }
      }

      const attendanceToday = {
        presentCount,
        absentCount,
        totalExpected: totalEnrolled || 1,
        percentage:
          totalEnrolled > 0
            ? Math.round((presentCount / totalEnrolled) * 100)
            : 0,
      };

      // 5. Students at risk — use enrollments already fetched above

      const studentIds = Array.from(
        new Set(
          enrollments.map((e: Record<string, unknown>) => e.studentId as number)
        )
      );

      const studentsAtRisk: Array<{
        studentId: number;
        studentName: string;
        className: string;
        absenceRate: number;
        totalAbsences: number;
      }> = [];

      if (studentIds.length > 0) {
        const allRecords = await listEntityRows("attendanceRecords", {
          filters: { studentId: studentIds },
          limit: 5000,
        });

        const studentAbsences: Record<
          number,
          { total: number; absences: number }
        > = {};
        for (const r of allRecords) {
          const rr = r as Record<string, unknown>;
          const sid = rr.studentId as number;
          if (!studentAbsences[sid])
            studentAbsences[sid] = { total: 0, absences: 0 };
          studentAbsences[sid].total++;
          if (rr.status === "absent") studentAbsences[sid].absences++;
        }

        const atRiskIds = Object.entries(studentAbsences)
          .filter(([, d]) => d.total > 0 && d.absences / d.total > 0.25)
          .map(([id]) => Number(id));

        if (atRiskIds.length > 0) {
          const atRiskStudents = await listEntityRows("students", {
            filters: { id: atRiskIds },
            limit: atRiskIds.length,
          });

          // Build class lookup from enrollments + schoolClasses already loaded
          const classMap = new Map(
            schoolClasses.map((c: Record<string, unknown>) => [
              c.id as number,
              c.name as string,
            ])
          );
          const enrollMap = new Map(
            enrollments.map((e: Record<string, unknown>) => [
              e.studentId as number,
              e.classId as number,
            ])
          );

          for (const s of atRiskStudents) {
            const sr = s as Record<string, unknown>;
            const sid = sr.id as number;
            const classId = enrollMap.get(sid);
            const className = classId ? (classMap.get(classId) ?? "?") : "?";
            const data = studentAbsences[sid];
            studentsAtRisk.push({
              studentId: sid,
              studentName: sr.name as string,
              className,
              absenceRate: Math.round((data.absences / data.total) * 100),
              totalAbsences: data.absences,
            });
          }
        }
      }

      // 6. Pending justifications
      const justifications = await listEntityRows("absenceJustifications", {
        filters: { schoolId: input.schoolId, status: "pending" },
        limit: 100,
      });
      const pendingJustifications = justifications.length;

      // 7. Upcoming events
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

  // Attendance report filtered by school
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

      const classFilters: Record<string, unknown> = { schoolId: input.schoolId };
      if (input.classId) classFilters.id = input.classId;

      const schoolClasses = await listEntityRows("classes", {
        filters: classFilters as Record<string, string | number | boolean | null | undefined>,
        limit: 500,
      });
      const classIds = schoolClasses.map(
        (c: Record<string, unknown>) => c.id as number
      );
      if (!classIds.length) return { totalRecords: 0, records: [] };

      const classSubjects = await listEntityRows("classSubjects", {
        filters: { classId: classIds },
        limit: 1000,
      });
      const csIds = classSubjects.map(
        (cs: Record<string, unknown>) => cs.id as number
      );
      if (!csIds.length) return { totalRecords: 0, records: [] };

      const sessions = await listEntityRows("classSessions", {
        filters: { classSubjectId: csIds },
        limit: 2000,
      });
      const sessionIds = sessions.map(
        (s: Record<string, unknown>) => s.id as number
      );
      if (!sessionIds.length) return { totalRecords: 0, records: [] };

      const records = await listEntityRows("attendanceRecords", {
        filters: { classSessionId: sessionIds },
        limit: 5000,
      });
      return { totalRecords: records.length, records };
    }),

  // Grades report filtered by school
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

      const classFilters: Record<string, unknown> = { schoolId: input.schoolId };
      if (input.classId) classFilters.id = input.classId;

      const schoolClasses = await listEntityRows("classes", {
        filters: classFilters as Record<string, string | number | boolean | null | undefined>,
        limit: 500,
      });
      const classIds = schoolClasses.map(
        (c: Record<string, unknown>) => c.id as number
      );
      if (!classIds.length) return { totalScores: 0, scores: [], averageScore: "—" };

      const classSubjects = await listEntityRows("classSubjects", {
        filters: { classId: classIds },
        limit: 1000,
      });
      const csIds = classSubjects.map(
        (cs: Record<string, unknown>) => cs.id as number
      );
      if (!csIds.length) return { totalScores: 0, scores: [], averageScore: "—" };

      const assessments = await listEntityRows("assessments", {
        filters: { classSubjectId: csIds },
        limit: 500,
      });
      const assessmentIds = assessments.map(
        (a: Record<string, unknown>) => a.id as number
      );
      if (!assessmentIds.length) return { totalScores: 0, scores: [], averageScore: "—" };

      const scores = await listEntityRows("assessmentScores", {
        filters: { assessmentId: assessmentIds },
        limit: 5000,
      });

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

  // Users linked to a school (via userSchools)
  users: protectedProcedure
    .input(z.object({ schoolId: z.number().int().positive() }))
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

      const userSchools = await listEntityRows("userSchools", {
        filters: { schoolId: input.schoolId },
        limit: 500,
      });
      const userIds = userSchools.map(
        (us: Record<string, unknown>) => us.userId as number
      );
      if (!userIds.length) return [];

      return await listEntityRows("users", {
        filters: { id: userIds },
        limit: userIds.length,
      });
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
      const studentAttendance = (await listEntityRows("attendanceRecords", {
        filters: { studentId: input.studentId },
        limit: 5000,
      })) as Record<string, unknown>[];

      // Grade scores
      const studentGrades = (await listEntityRows("assessmentScores", {
        filters: { studentId: input.studentId },
        limit: 5000,
      })) as Record<string, unknown>[];

      // Comments
      const comments = (await listEntityRows("studentComments", {
        filters: { studentId: input.studentId },
        limit: 500,
      })) as Record<string, unknown>[];

      // Guardian links
      const guardianLinks = (await listEntityRows("studentGuardians", {
        filters: { studentId: input.studentId },
        limit: 10,
      })) as Record<string, unknown>[];

      const guardianIds = guardianLinks.map(
        (l) => (l as Record<string, unknown>).guardianId as number
      );
      const guardianDetails =
        guardianIds.length > 0
          ? await listEntityRows("guardians", {
              filters: { id: guardianIds },
              limit: guardianIds.length,
            })
          : [];

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
