import { createNotification } from "../../db";

/**
 * Service for creating automatic notifications based on system events
 */
export class NotificationService {
  /**
   * Notify guardians when a student absence is recorded
   * @param studentId The ID of the absent student
   * @param sessionDate The date of the session (YYYY-MM-DD)
   * @param subject The subject/class name
   * @param teacherName The name of the teacher who recorded the absence
   */
  static async notifyAbsence(
    studentId: number,
    sessionDate: string,
    subject: string,
    teacherName: string
  ): Promise<void> {
    try {
      // Get guardian IDs linked to the student
      const { listEntityRows } = await import("../../db");
      const studentGuardians = await listEntityRows("studentGuardians", {
        filters: { studentId },
      });

      // Get student name for the notification
      const { getEntityById } = await import("../../db");
      const student = await getEntityById("students", studentId);
      const studentName = student?.name ?? "Aluno";

      // Create notification for each guardian
      for (const sg of studentGuardians) {
        try {
          // Get the guardian's user ID
          const guardian = await getEntityById(
            "guardians",
            (sg as Record<string, unknown>).guardianId as number
          );
          const guardianUserId = guardian?.userId;

          if (guardianUserId) {
            await createNotification({
              userId: guardianUserId,
              notificationType: "absence_alert",
              title: "Falta registrada",
              body: `${studentName} ficou ausente em ${subject} (${sessionDate}) — Prof. ${teacherName}`,
              actionUrl: "/dashboard/frequencia",
            });
          }
        } catch (error) {
          // Log error but don't break the main operation
          console.error(
            `Failed to create absence notification for guardian:`,
            error
          );
        }
      }
    } catch (error) {
      // Log error but don't break the main operation
      console.error("Failed to create absence notifications:", error);
    }
  }

  /**
   * Notify student and guardians when a grade is published
   * @param studentId The ID of the student
   * @param assessmentTitle The title of the assessment
   * @param subject The subject name
   * @param score The score obtained
   */
  static async notifyGradePublished(
    studentId: number,
    assessmentTitle: string,
    subject: string,
    score: number
  ): Promise<void> {
    try {
      // Get student user ID
      const { getEntityById } = await import("../../db");
      const student = await getEntityById("students", studentId);
      const studentUserId = student?.userId;

      // Get guardian IDs linked to the student
      const { listEntityRows } = await import("../../db");
      const studentGuardians = await listEntityRows("studentGuardians", {
        filters: { studentId },
      });

      // Notify student
      if (studentUserId) {
        try {
          await createNotification({
            userId: studentUserId,
            notificationType: "grade_published",
            title: "Nova nota publicada",
            body: `${assessmentTitle} (${subject}): ${score}`,
            actionUrl: "/dashboard/desempenho",
          });
        } catch (error) {
          console.error(
            `Failed to create grade notification for student:`,
            error
          );
        }
      }

      // Notify guardians
      for (const sg of studentGuardians) {
        try {
          // Get the guardian's user ID
          const guardian = await getEntityById(
            "guardians",
            (sg as Record<string, unknown>).guardianId as number
          );
          const guardianUserId = guardian?.userId;

          if (guardianUserId) {
            await createNotification({
              userId: guardianUserId,
              notificationType: "grade_published",
              title: "Nova nota publicada",
              body: `${assessmentTitle} (${subject}): ${score}`,
              actionUrl: "/dashboard/desempenho",
            });
          }
        } catch (error) {
          console.error(
            `Failed to create grade notification for guardian:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Failed to create grade notifications:", error);
    }
  }

  /**
   * Notify relevant parties when a comment is created
   * @param studentId The ID of the student the comment is about
   * @param visibility The visibility level of the comment
   * @param teacherName The name of the teacher who created the comment
   * @param category The category of the comment (elogio/melhoria)
   */
  static async notifyComment(
    studentId: number,
    visibility: string,
    teacherName: string,
    category: string
  ): Promise<void> {
    try {
      // Get student user ID
      const { getEntityById } = await import("../../db");
      const student = await getEntityById("students", studentId);
      const studentUserId = student?.userId;

      // Notify student if visibility allows
      if ((visibility === "student" || visibility === "all") && studentUserId) {
        try {
          await createNotification({
            userId: studentUserId,
            notificationType: "comment_received",
            title: "Novo comentário recebido",
            body: `Você recebeu um comentário de ${category}`,
            actionUrl: "/dashboard/comentarios",
            // Note: For student notifications, we don't include teacherName
            // to maintain anonymity as per specification
          });
        } catch (error) {
          console.error(
            `Failed to create comment notification for student:`,
            error
          );
        }
      }

      // Notify guardians if visibility allows
      if (visibility === "guardian" || visibility === "all") {
        // Get guardian IDs linked to the student
        const { listEntityRows } = await import("../../db");
        const studentGuardians = await listEntityRows("studentGuardians", {
          filters: { studentId },
        });

        for (const sg of studentGuardians) {
          try {
            // Get the guardian's user ID
            const guardian = await getEntityById(
              "guardians",
              (sg as Record<string, unknown>).guardianId as number
            );
            const guardianUserId = guardian?.userId;

            if (guardianUserId) {
              await createNotification({
                userId: guardianUserId,
                notificationType: "comment_received",
                title: "Novo comentário recebido",
                body: `${teacherName} comentou sobre ${category}`,
                actionUrl: "/dashboard/comentarios",
              });
            }
          } catch (error) {
            console.error(
              `Failed to create comment notification for guardian:`,
              error
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to create comment notifications:", error);
    }
  }

  /**
   * Notify recipients when a communication is published
   * @param communicationId The ID of the communication
   */
  static async notifyCommunication(communicationId: number): Promise<void> {
    try {
      // Get communication recipients
      const { listEntityRows } = await import("../../db");
      const communicationRecipients = await listEntityRows(
        "communicationRecipients",
        { filters: { communicationId } }
      );

      // Get communication details for the notification
      const { getEntityById } = await import("../../db");
      const communication = await getEntityById(
        "communications",
        communicationId
      );

      if (!communication) return;

      // Create notification for each recipient
      for (const cr of communicationRecipients) {
        try {
          const recipient = cr as Record<string, unknown>;
          const recipientType = recipient.recipientType as string;
          const recipientRefId = recipient.recipientRefId as number;

          // Resolve userId from recipientType + recipientRefId
          let userId: number | undefined;
          const { getEntityById } = await import("../../db");
          if (recipientType === "student") {
            const student = await getEntityById("students", recipientRefId);
            userId = student?.userId as number | undefined;
          } else if (recipientType === "guardian") {
            const guardian = await getEntityById("guardians", recipientRefId);
            userId = guardian?.userId as number | undefined;
          } else if (recipientType === "teacher") {
            const teacher = await getEntityById("teachers", recipientRefId);
            userId = teacher?.userId as number | undefined;
          } else if (recipientType === "staff") {
            const staff = await getEntityById("schoolStaffProfiles", recipientRefId);
            userId = staff?.userId as number | undefined;
          }

          if (!userId) continue;

          await createNotification({
            userId,
            notificationType: "communication",
            title: communication.title,
            body: communication.body?.substring(0, 100) + "...", // Truncate long bodies
            actionUrl: "/dashboard/comunicados",
          });
        } catch (error) {
          console.error(
            `Failed to create communication notification for recipient:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Failed to create communication notifications:", error);
    }
  }

  /**
   * Notify users when an event is created
   * @param eventId The ID of the event
   */
  static async notifyEvent(eventId: number): Promise<void> {
    try {
      // Get event targets
      const { listEntityRows } = await import("../../db");
      const eventTargets = await listEntityRows("eventTargets", {
        filters: { eventId },
      });

      // Get event details
      const { getEntityById } = await import("../../db");
      const event = await getEntityById("schoolEvents", eventId);

      if (!event) return;

      // Resolve target user IDs based on target type
      const userIdsToNotify: number[] = [];

      for (const target of eventTargets) {
        const t = target as Record<string, unknown>;
        const targetType = t.targetType as string;
        const targetRefId = t.targetRefId as number | null;

        if (targetType === "all") {
          // Notify all active users in the school
          // For simplicity in MVP, we'll notify all users (can be optimized later)
          // TODO: Implement proper school-wide notification
        } else if (targetType === "school" && targetRefId !== null) {
          // Notify all users associated with this school
          try {
            const { listEntityRows } = await import("../../db");

            // Teachers in this school
            const teachers = await listEntityRows("teachers", {
              filters: { schoolId: targetRefId },
            });
            for (const t of teachers) {
              const teacher = t as Record<string, unknown>;
              if (teacher.userId) userIdsToNotify.push(teacher.userId as number);
            }

            // Guardians in this school
            const guardians = await listEntityRows("guardians", {
              filters: { schoolId: targetRefId },
            });
            for (const g of guardians) {
              const guardian = g as Record<string, unknown>;
              if (guardian.userId) userIdsToNotify.push(guardian.userId as number);
            }

            // Students with userId in this school
            const students = await listEntityRows("students", {
              filters: { schoolId: targetRefId },
            });
            for (const s of students) {
              const student = s as Record<string, unknown>;
              if (student.userId) userIdsToNotify.push(student.userId as number);
            }

            // School staff / coordinators via userSchools
            const userSchools = await listEntityRows("userSchools", {
              filters: { schoolId: targetRefId },
            });
            for (const us of userSchools) {
              const userSchool = us as Record<string, unknown>;
              userIdsToNotify.push(userSchool.userId as number);
            }
          } catch (error) {
            console.error(
              `Failed to resolve school targets for event notification:`,
              error
            );
          }
        } else if (targetType === "class" && targetRefId !== null) {
          // Notify students and guardians in the specific class
          try {
            // Get enrolled students in the class
            const { listEntityRows } = await import("../../db");
            const classEnrollments = await listEntityRows("classEnrollments", {
              filters: { classId: targetRefId, status: "ativo" },
            });

            // Get student IDs
            const studentIds = classEnrollments.map(
              (e: Record<string, unknown>) => e.studentId as number
            );

            // Get student user IDs
            const { getEntityById } = await import("../../db");
            for (const studentId of studentIds) {
              const student = await getEntityById("students", studentId);
              if (student?.userId) {
                userIdsToNotify.push(student.userId);
              }
            }

            // Get guardian IDs for those students
            const studentGuardians = await listEntityRows(
              "studentGuardians",
              {}
            ); // We'll filter below

            for (const sg of studentGuardians) {
              const ssg = sg as Record<string, unknown>;
              if (studentIds.includes(ssg.studentId as number)) {
                const guardian = await getEntityById(
                  "guardians",
                  ssg.guardianId as number
                );
                if (guardian?.userId) {
                  userIdsToNotify.push(guardian.userId);
                }
              }
            }
          } catch (error) {
            console.error(
              `Failed to resolve class targets for event notification:`,
              error
            );
          }
        }
        // TODO: Handle grade/series targets ('grade' targetType)
      }

      // Deduplicate user IDs
      const uniqueUserIds = [...new Set(userIdsToNotify)];

      // Create notification for each user
      for (const userId of uniqueUserIds) {
        try {
          await createNotification({
            userId,
            notificationType: "event_reminder",
            title: `Lembrete de evento: ${event.title}`,
            body: `${event.description} - ${new Date(
              event.startsAt
            ).toLocaleDateString("pt-BR")}`,
            actionUrl: "/dashboard/eventos",
          });
        } catch (error) {
          console.error(
            `Failed to create event notification for user ${userId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Failed to create event notifications:", error);
    }
  }

  /**
   * Notify guardians when a student has 3+ consecutive absences
   * Called after each absence recording to check the streak
   * @param studentId The ID of the absent student
   * @param sessionDate The date of the most recent absence
   * @param subject The subject name
   */
  static async notifyConsecutiveAbsence(
    studentId: number,
    sessionDate: string,
    subject: string
  ): Promise<void> {
    try {
      const { listEntityRows, getEntityById } = await import("../../db");

      // Get all attendance records for this student, sorted by date desc
      const allRecords = await listEntityRows("attendanceRecords", {
        limit: 2000,
      });
      const studentRecords = allRecords
        .filter((r: Record<string, unknown>) => r.studentId === studentId)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const dateA = String(a.createdAt ?? "");
          const dateB = String(b.createdAt ?? "");
          return dateB.localeCompare(dateA);
        });

      // Count consecutive absences from the most recent
      let consecutive = 0;
      for (const r of studentRecords) {
        if ((r as Record<string, unknown>).status === "absent") {
          consecutive++;
        } else {
          break; // streak broken
        }
      }

      // Only notify if 3 or more consecutive absences
      if (consecutive < 3) return;

      // Get student name
      const student = await getEntityById("students", studentId);
      const studentName = student?.name ?? "Aluno";

      // Get guardians
      const studentGuardians = await listEntityRows("studentGuardians", {
        filters: { studentId },
      });

      for (const sg of studentGuardians) {
        try {
          const guardian = await getEntityById(
            "guardians",
            (sg as Record<string, unknown>).guardianId as number
          );
          const guardianUserId = guardian?.userId;

          if (guardianUserId) {
            await createNotification({
              userId: guardianUserId,
              notificationType: "absence_alert",
              title: `⚠️ ${consecutive} faltas consecutivas!`,
              body: `${studentName} acumulou ${consecutive} faltas consecutivas. A última foi em ${subject} (${sessionDate}). A frequência pode comprometer o Pé de Meia.`,
              actionUrl: "/dashboard/frequencia",
            });
          }
        } catch (error) {
          console.error(
            "Failed to create consecutive absence notification:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Failed to check consecutive absences:", error);
    }
  }

  /**
   * Notify guardians when their justification request is reviewed
   * @param guardianId The ID of the guardian who submitted the justification
   * @param status The review status ('approved' or 'rejected')
   * @param reason Optional reason for rejection
   */
  static async notifyJustificationResult(
    guardianId: number,
    status: "approved" | "rejected",
    reason?: string
  ): Promise<void> {
    try {
      // Get guardian user ID
      const { getEntityById } = await import("../../db");
      const guardian = await getEntityById("guardians", guardianId);
      const guardianUserId = guardian?.userId;

      if (!guardianUserId) return;

      const title =
        status === "approved"
          ? "Justificativa aprovada"
          : "Justificativa rejeitada";
      const body = reason
        ? `${title}. Motivo: ${reason}`
        : `${title}.${reason ? " Motivo: " + reason : ""}`;

      try {
        await createNotification({
          userId: guardianUserId,
          notificationType: "justification_result",
          title,
          body,
          actionUrl: "/dashboard/justificativas",
        });
      } catch (error) {
        console.error(
          `Failed to create justification notification for guardian:`,
          error
        );
      }
    } catch (error) {
      console.error("Failed to create justification notification:", error);
    }
  }
}
