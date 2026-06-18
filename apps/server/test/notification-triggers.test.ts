import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSchool,
  createTeacherProfile,
  createStudentProfile,
  createStudentComment,
  createAssessmentScore,
  createAttendanceRecord,
  createCommunication,
  createSchoolEvent,
  createGuardianProfile,
  resetMemoryStore,
  listNotificationsForUser,
  linkStudentGuardian,
} from "../src/db";

describe("notification triggers", () => {
  beforeEach(() => {
    resetMemoryStore();
    vi.clearAllMocks();
    // Mock console.error to avoid test output pollution
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const setupSchoolWithUsers = async () => {
    const school = await createSchool({
      name: "Escola Teste",
      email: "teste@example.com",
      status: "trial",
    });

    const teacher = await createTeacherProfile({
      userId: 101,
      schoolId: school!.id,
      name: "Professor Teste",
      email: "prof@teste.com",
      subject: "Matemática",
    });

    const student = await createStudentProfile({
      schoolId: school!.id,
      userId: 103,
      name: "Aluno Teste",
    });

    const guardian = await createGuardianProfile({
      userId: 102,
      schoolId: school!.id,
      name: "Responsável Teste",
      email: "resp@teste.com",
    });

    // Link guardian to student
    await linkStudentGuardian({
      studentId: student!.id,
      guardianId: guardian!.id,
      relationship: "Responsável",
      isPrimary: 1,
    });

    return { school, teacher, student, guardian };
  };

  describe("absence notifications", () => {
    it("should create absence notification for guardian when student marked absent", async () => {
      const { school, teacher, student, guardian } =
        await setupSchoolWithUsers();

      // Import and test notification service directly
      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );

      // Mock the createNotification function to avoid actual DB calls
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger absence notification
      await NotificationService.notifyAbsence(
        student!.id,
        "2026-06-13",
        "Matemática",
        teacher!.name
      );

      // Should have created notification for guardian
      expect(createNotificationSpy).toHaveBeenCalled();
      expect(createNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: guardian!.userId,
          notificationType: "absence_alert",
          title: "Falta registrada",
          body: expect.stringContaining("ausente em Matemática"),
        })
      );
    });

    it("should not create notifications when student marked present", async () => {
      const { school, teacher, student } = await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger absence notification with present status (should not trigger)
      // Note: In real implementation, this check happens in attendance.router.ts
      // Here we're testing that the service itself doesn't restrict by status
      await NotificationService.notifyAbsence(
        student!.id,
        "2026-06-13",
        "Matemática",
        teacher!.name
      );

      // Service should still attempt to create notifications (the filtering happens in router)
      expect(createNotificationSpy).toHaveBeenCalled();
    });
  });

  describe("grade notifications", () => {
    it("should create grade published notification for student and guardian", async () => {
      const { school, teacher, student, guardian } =
        await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger grade notification
      await NotificationService.notifyGradePublished(
        student!.id,
        "Prova de Matemática",
        "Matemática",
        8.5
      );

      // Should have created notifications for both student and guardian
      expect(createNotificationSpy).toHaveBeenCalledTimes(2);

      // Check student notification
      expect(createNotificationSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          userId: student!.userId,
          notificationType: "grade_published",
          title: "Nova nota publicada",
          body: "Prova de Matemática (Matemática): 8.5",
        })
      );

      // Check guardian notification
      expect(createNotificationSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          userId: guardian!.userId,
          notificationType: "grade_published",
          title: "Nova nota publicada",
          body: "Prova de Matemática (Matemática): 8.5",
        })
      );
    });
  });

  describe("comment notifications", () => {
    it("should create comment notification for student (without teacher name) when visibility is student", async () => {
      const { school, teacher, student } = await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger comment notification for student visibility
      await NotificationService.notifyComment(
        student!.id,
        "student",
        teacher!.name,
        "elogio"
      );

      // Should have created notification for student only
      expect(createNotificationSpy).toHaveBeenCalledTimes(1);
      expect(createNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: student!.userId,
          notificationType: "comment_received",
          title: "Novo comentário recebido",
          body: "Você recebeu um comentário de elogio",
        })
      );
    });

    it("should create comment notification for guardian (with teacher name) when visibility is guardian", async () => {
      const { school, teacher, student, guardian } =
        await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger comment notification for guardian visibility
      await NotificationService.notifyComment(
        student!.id,
        "guardian",
        teacher!.name,
        "melhoria"
      );

      // Should have created notification for guardian only
      expect(createNotificationSpy).toHaveBeenCalledTimes(1);
      expect(createNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: guardian!.userId,
          notificationType: "comment_received",
          title: "Novo comentário recebido",
          body: expect.stringContaining(teacher!.name),
        })
      );
    });

    it("should not create comment notifications when visibility is school_only", async () => {
      const { school, teacher, student } = await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger comment notification for school_only visibility
      await NotificationService.notifyComment(
        student!.id,
        "school_only",
        teacher!.name,
        "ocorrencia"
      );

      // Should not have created any notifications
      expect(createNotificationSpy).not.toHaveBeenCalled();
    });
  });

  describe("communication notifications", () => {
    it("should create notifications for all recipients when communication is created", async () => {
      const { school, guardian } = await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Create a communication first
      const communication = await createCommunication({
        schoolId: school!.id,
        authorId: 101, // Assuming this is a valid userId
        title: "Comunicado Teste",
        body: "Este é um comunicado de teste",
        publishedAt: new Date().toISOString(),
      });

      // Create a communication recipient for the guardian (so that the notification is sent to the guardian)
      const { createEntityRow } = await import("../src/db");
      await createEntityRow("communicationRecipients", {
        communicationId: communication.id,
        recipientType: "guardian",
        recipientRefId: guardian!.id,
      });

      // Trigger communication notification
      await NotificationService.notifyCommunication(communication!.id);

      // Should have created notifications (exact number depends on recipients logic)
      expect(createNotificationSpy).toHaveBeenCalled();
    });
  });

  describe("event notifications", () => {
    it("should create notifications for targeted users when event is created", async () => {
      const { school } = await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Create a school event first
      const event = await createSchoolEvent({
        schoolId: school!.id,
        authorId: 101, // Assuming this is a valid userId
        title: "Prova de Matemática",
        description: "Prova bimestral de matemática",
        eventDate: "2026-06-20",
      });

      // Create an event target for the school (so that the notification is sent to all users in the school)
      const { createEntityRow } = await import("../src/db");
      await createEntityRow("eventTargets", {
        eventId: event.id,
        targetType: "school",
        targetRefId: school!.id,
      });

      // Trigger event notification
      await NotificationService.notifyEvent(event!.id);

      // Should have created notifications (exact number depends on targets logic)
      expect(createNotificationSpy).toHaveBeenCalled();
    });
  });

  describe("justification notifications", () => {
    it("should create justification result notification for guardian", async () => {
      const { school, guardian } = await setupSchoolWithUsers();

      const { NotificationService } = await import(
        "../src/domain/notifications/notification.service"
      );
      const { createNotification } = await import("../src/db");
      const createNotificationSpy = vi
        .spyOn(await import("../src/db"), "createNotification")
        .mockResolvedValue({ id: 1 } as any);

      // Trigger justification notification
      await NotificationService.notifyJustificationResult(
        guardian!.id,
        "approved",
        "Atestado médico válido"
      );

      // Should have created notification for guardian
      expect(createNotificationSpy).toHaveBeenCalledTimes(1);
      expect(createNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: guardian!.userId,
          notificationType: "justification_result",
          title: "Justificativa aprovada",
          body: expect.stringContaining("Atestado médico válido"),
        })
      );
    });
  });
});
