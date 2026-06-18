import { TRPCError } from "@trpc/server";
import { createEntityRow, listEntityRows } from "../../db";

export class EventsService {
  static async createEvent(
    schoolId: number,
    authorUserId: number | null,
    input: {
      title: string;
      description?: string | null;
      eventType: string;
      startsAt: string;
      endsAt?: string | null;
      targetConfig: string;
      targetRefId?: number;
    }
  ) {
    const event = await createEntityRow("schoolEvents", {
      schoolId,
      title: input.title,
      description: input.description || null,
      eventType: input.eventType,
      startsAt: input.startsAt,
      endsAt: input.endsAt || null,
      createdByUserId: authorUserId,
    });

    if (!event) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao criar evento",
      });
    }

    const eventId = (event as Record<string, unknown>).id as number;

    // Create event targets
    if (input.targetConfig === "all") {
      await createEntityRow("eventTargets", {
        eventId,
        targetType: "school",
        targetRefId: schoolId,
      });
    } else if (input.targetConfig === "class" && input.targetRefId) {
      await createEntityRow("eventTargets", {
        eventId,
        targetType: "class",
        targetRefId: input.targetRefId,
      });
    }

    return event;
  }

  static async getEventsForUser(userId: number, schoolId: number) {
    // Get all school events
    const allEvents = await listEntityRows("schoolEvents", {
      filters: { schoolId },
      limit: 100,
      orderBy: "startsAt",
      orderDirection: "asc",
    });

    // Check which events target this user's classes
    const classIds: number[] = [];

    // Find student enrollments
    const students = await listEntityRows("students", {
      filters: { userId },
      limit: 10,
    });
    for (const s of students) {
      const enrollments = await listEntityRows("classEnrollments", {
        filters: {
          studentId: (s as Record<string, unknown>).id,
          status: "ativo",
        },
      });
      for (const e of enrollments) {
        classIds.push((e as Record<string, unknown>).classId as number);
      }
    }

    // Find guardian's student enrollments
    const guardians = await listEntityRows("guardians", {
      filters: { userId },
      limit: 10,
    });
    for (const g of guardians) {
      const sgs = await listEntityRows("studentGuardians", {
        filters: { guardianId: (g as Record<string, unknown>).id },
      });
      for (const sg of sgs) {
        const enrollments = await listEntityRows("classEnrollments", {
          filters: {
            studentId: (sg as Record<string, unknown>).studentId,
            status: "ativo",
          },
        });
        for (const e of enrollments) {
          classIds.push((e as Record<string, unknown>).classId as number);
        }
      }
    }

    // Find teacher's classes
    const teachers = await listEntityRows("teachers", {
      filters: { userId },
      limit: 10,
    });
    for (const t of teachers) {
      const cts = await listEntityRows("classTeachers", {
        filters: { teacherId: (t as Record<string, unknown>).id },
      });
      for (const ct of cts) {
        const cs = await listEntityRows("classSubjects", {
          filters: { id: (ct as Record<string, unknown>).classSubjectId },
        });
        for (const c of cs) {
          classIds.push((c as Record<string, unknown>).classId as number);
        }
      }
    }

    const uniqueClassIds = [...new Set(classIds)];

    // Get event targets
    const targets = await listEntityRows("eventTargets", { limit: 1000 });

    // Filter events: school-wide events + events targeting user's classes
    const schoolWideEventIds = new Set<number>();
    const classEventIds = new Set<number>();

    for (const target of targets) {
      const t = target as Record<string, unknown>;
      const eventId = t.eventId as number;
      const targetType = t.targetType as string;
      const targetRefId = t.targetRefId as number;

      if (targetType === "school") {
        schoolWideEventIds.add(eventId);
      } else if (
        targetType === "class" &&
        uniqueClassIds.includes(targetRefId)
      ) {
        classEventIds.add(eventId);
      }
    }

    return allEvents.filter((e: Record<string, unknown>) => {
      const eventId = e.id as number;
      return schoolWideEventIds.has(eventId) || classEventIds.has(eventId);
    });
  }
}
