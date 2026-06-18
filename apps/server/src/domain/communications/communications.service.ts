import { TRPCError } from "@trpc/server";
import {
  createEntityRow,
  getEntityById,
  listEntityRows,
  updateEntityRow,
} from "../../db";

export class CommunicationsService {
  static async publishCommunication(
    schoolId: number,
    authorUserId: number | null,
    input: {
      title: string;
      body: string;
      communicationType: string;
      targetConfig: string;
      classId?: number;
      relatedEventId?: number;
    }
  ) {
    const communication = await createEntityRow("communications", {
      schoolId,
      authorUserId,
      title: input.title,
      body: input.body,
      communicationType: input.communicationType,
      relatedEventId: input.relatedEventId || null,
    });

    if (!communication) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao criar comunicado",
      });
    }

    const commId = (communication as Record<string, unknown>).id as number;

    // Resolve recipients
    const recipientRefs: Array<{
      recipientType: string;
      recipientRefId: number;
      userId: number;
    }> = [];

    if (
      input.targetConfig === "all" ||
      input.targetConfig === "guardians_only"
    ) {
      // Get all guardians of the school (or filtered by class)
      if (input.classId) {
        const enrollments = await listEntityRows("classEnrollments", {
          filters: { classId: input.classId, status: "ativo" },
        });
        for (const enrollment of enrollments) {
          const e = enrollment as Record<string, unknown>;
          const studentId = e.studentId as number;
          const sgs = await listEntityRows("studentGuardians", {
            filters: { studentId },
          });
          for (const sg of sgs) {
            const g = sg as Record<string, unknown>;
            const guardian = await getEntityById(
              "guardians",
              g.guardianId as number
            );
            if (guardian && (guardian as Record<string, unknown>).userId) {
              recipientRefs.push({
                recipientType: "guardian",
                recipientRefId: g.guardianId as number,
                userId: (guardian as Record<string, unknown>).userId as number,
              });
            }
          }
        }
      } else {
        const guardians = await listEntityRows("guardians", {
          filters: { schoolId },
          limit: 500,
        });
        for (const g of guardians) {
          const gr = g as Record<string, unknown>;
          if (gr.userId) {
            recipientRefs.push({
              recipientType: "guardian",
              recipientRefId: gr.id as number,
              userId: gr.userId as number,
            });
          }
        }
      }
    }

    if (
      input.targetConfig === "all" ||
      input.targetConfig === "teachers_only"
    ) {
      const teachers = await listEntityRows("teachers", {
        filters: { schoolId },
        limit: 200,
      });
      for (const t of teachers) {
        const tr = t as Record<string, unknown>;
        if (tr.userId) {
          recipientRefs.push({
            recipientType: "teacher",
            recipientRefId: tr.id as number,
            userId: tr.userId as number,
          });
        }
      }
    }

    // Also include students for "all"
    if (input.targetConfig === "all") {
      if (input.classId) {
        const enrollments = await listEntityRows("classEnrollments", {
          filters: { classId: input.classId, status: "ativo" },
        });
        for (const enrollment of enrollments) {
          const e = enrollment as Record<string, unknown>;
          const studentId = e.studentId as number;
          const student = await getEntityById("students", studentId);
          if (student && (student as Record<string, unknown>).userId) {
            recipientRefs.push({
              recipientType: "student",
              recipientRefId: studentId,
              userId: (student as Record<string, unknown>).userId as number,
            });
          }
        }
      } else {
        const students = await listEntityRows("students", {
          filters: { schoolId, status: "ativo" },
          limit: 500,
        });
        for (const s of students) {
          const sr = s as Record<string, unknown>;
          if (sr.userId) {
            recipientRefs.push({
              recipientType: "student",
              recipientRefId: sr.id as number,
              userId: sr.userId as number,
            });
          }
        }
      }
    }

    // Deduplicate by userId
    const seen = new Set<number>();
    const uniqueRecipients = recipientRefs.filter(r => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });

    // Create communication recipients
    for (const r of uniqueRecipients) {
      await createEntityRow("communicationRecipients", {
        communicationId: commId,
        recipientType: r.recipientType,
        recipientRefId: r.recipientRefId,
      });
    }

    return { communication, recipientCount: uniqueRecipients.length };
  }

  static async getCommunicationsForUser(userId: number, schoolId: number) {
    // Get communications where this user is a recipient
    const allComms = await listEntityRows("communications", {
      filters: { schoolId },
      limit: 100,
      orderBy: "createdAt",
      orderDirection: "desc",
    });

    const userRecipients = await listEntityRows("communicationRecipients", {
      limit: 1000,
    });

    // Find communications where the user has a recipient entry
    // We need to find the user's profile IDs
    const student = await getEntityById("students", userId); // This won't work for user ID
    // Better approach: find all recipient refs that map to this user
    const teacher = await listEntityRows("teachers", {
      filters: { userId },
      limit: 1,
    });
    const guardian = await listEntityRows("guardians", {
      filters: { userId },
      limit: 1,
    });
    const studentList = await listEntityRows("students", {
      filters: { userId },
      limit: 1,
    });

    const profileRefs: Array<{ type: string; refId: number }> = [];
    if (teacher.length > 0)
      profileRefs.push({
        type: "teacher",
        refId: (teacher[0] as Record<string, unknown>).id as number,
      });
    if (guardian.length > 0)
      profileRefs.push({
        type: "guardian",
        refId: (guardian[0] as Record<string, unknown>).id as number,
      });
    if (studentList.length > 0)
      profileRefs.push({
        type: "student",
        refId: (studentList[0] as Record<string, unknown>).id as number,
      });

    const userCommIds = new Set<number>();
    for (const r of userRecipients) {
      const rr = r as Record<string, unknown>;
      const commId = rr.communicationId as number;
      const type = rr.recipientType as string;
      const refId = rr.recipientRefId as number;
      if (profileRefs.some(p => p.type === type && p.refId === refId)) {
        userCommIds.add(commId);
      }
    }

    // Filter communications that belong to user
    const filtered = allComms.filter((c: Record<string, unknown>) =>
      userCommIds.has(c.id as number)
    );

    // Add read status
    return filtered.map((c: Record<string, unknown>) => {
      const recipients = userRecipients.filter(
        (r: Record<string, unknown>) =>
          (r.communicationId as number) === (c.id as number) &&
          profileRefs.some(
            p =>
              p.type === (r.recipientType as string) &&
              p.refId === (r.recipientRefId as number)
          )
      );
      const readAt =
        recipients.length > 0
          ? (recipients[0] as Record<string, unknown>).readAt
          : null;
      return { ...c, readAt };
    });
  }

  static async markRead(communicationId: number, userId: number) {
    const profileRefs: Array<{ type: string; refId: number }> = [];
    const teacher = await listEntityRows("teachers", {
      filters: { userId },
      limit: 1,
    });
    const guardian = await listEntityRows("guardians", {
      filters: { userId },
      limit: 1,
    });
    const studentList = await listEntityRows("students", {
      filters: { userId },
      limit: 1,
    });

    if (teacher.length > 0)
      profileRefs.push({
        type: "teacher",
        refId: (teacher[0] as Record<string, unknown>).id as number,
      });
    if (guardian.length > 0)
      profileRefs.push({
        type: "guardian",
        refId: (guardian[0] as Record<string, unknown>).id as number,
      });
    if (studentList.length > 0)
      profileRefs.push({
        type: "student",
        refId: (studentList[0] as Record<string, unknown>).id as number,
      });

    const recipients = await listEntityRows("communicationRecipients", {
      filters: { communicationId },
    });

    for (const r of recipients) {
      const rr = r as Record<string, unknown>;
      const recId = rr.id as number;
      const type = rr.recipientType as string;
      const refId = rr.recipientRefId as number;
      if (
        profileRefs.some(p => p.type === type && p.refId === refId) &&
        !rr.readAt
      ) {
        await updateEntityRow("communicationRecipients", recId, {
          readAt: new Date().toISOString(),
        });
      }
    }
  }

  static async getReadStats(communicationId: number) {
    const recipients = await listEntityRows("communicationRecipients", {
      filters: { communicationId },
    });
    const total = recipients.length;
    const read = recipients.filter(
      (r: Record<string, unknown>) => r.readAt
    ).length;
    return {
      total,
      read,
      unread: total - read,
      readPercentage: total > 0 ? Math.round((read / total) * 100) : 0,
    };
  }
}
