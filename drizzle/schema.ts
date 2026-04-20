import {
  date,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const mysqlTable = pgTable;
const int = integer;
const mysqlEnum = (name: string, _values: readonly [string, ...string[]]) =>
  varchar(name, { length: 64 });

// Identity
export const users = mysqlTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", [
      "user",
      "admin",
      "teacher",
      "student",
      "guardian",
      "school_staff",
    ])
      .default("user")
      .notNull(),
    defaultProfile: mysqlEnum("defaultProfile", [
      "school",
      "teacher",
      "student",
      "guardian",
    ]),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => [index("users_email_idx").on(table.email)]
);

// Institutions
export const schools = mysqlTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  studentCount: int("studentCount"),
  status: mysqlEnum("status", ["ativo", "inativo", "trial"])
    .default("trial")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const schoolYears = mysqlTable(
  "schoolYears",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 30 }).notNull(),
    startDate: date("startDate").notNull(),
    endDate: date("endDate").notNull(),
    isCurrent: int("isCurrent").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("schoolYears_school_name_uq").on(table.schoolId, table.name),
    index("schoolYears_school_idx").on(table.schoolId),
    index("schoolYears_current_idx").on(table.schoolId, table.isCurrent),
  ]
);

export const userSchools = mysqlTable(
  "userSchools",
  {
    id: serial("id").primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", [
      "admin",
      "director",
      "coordinator",
      "teacher",
      "guardian",
      "student",
    ])
      .default("coordinator")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("userSchools_user_school_uq").on(table.userId, table.schoolId),
    index("userSchools_user_idx").on(table.userId),
    index("userSchools_school_idx").on(table.schoolId),
  ]
);

export const schoolStaffProfiles = mysqlTable(
  "schoolStaffProfiles",
  {
    id: serial("id").primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", [
      "admin",
      "director",
      "coordinator",
      "secretary",
    ]).notNull(),
    positionTitle: varchar("positionTitle", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("schoolStaffProfiles_user_school_role_uq").on(
      table.userId,
      table.schoolId,
      table.role
    ),
    index("schoolStaffProfiles_school_idx").on(table.schoolId),
  ]
);

export const teachers = mysqlTable(
  "teachers",
  {
    id: serial("id").primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    subject: varchar("subject", { length: 100 }),
    active: int("active").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("teachers_user_school_uq").on(table.userId, table.schoolId),
    index("teachers_school_idx").on(table.schoolId),
    index("teachers_email_idx").on(table.email),
  ]
);

export const students = mysqlTable(
  "students",
  {
    id: serial("id").primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    enrollmentNumber: varchar("enrollmentNumber", { length: 64 }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    dateOfBirth: date("dateOfBirth"),
    grade: varchar("grade", { length: 50 }),
    status: mysqlEnum("status", ["ativo", "inativo", "transferido"])
      .default("ativo")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("students_user_school_uq").on(table.userId, table.schoolId),
    uniqueIndex("students_school_enrollment_uq").on(
      table.schoolId,
      table.enrollmentNumber
    ),
    index("students_school_idx").on(table.schoolId),
    index("students_status_idx").on(table.status),
  ]
);

export const guardians = mysqlTable(
  "guardians",
  {
    id: serial("id").primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    relationship: varchar("relationship", { length: 50 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("guardians_user_school_uq").on(table.userId, table.schoolId),
    index("guardians_school_idx").on(table.schoolId),
    index("guardians_email_idx").on(table.email),
  ]
);

export const studentGuardians = mysqlTable(
  "studentGuardians",
  {
    id: serial("id").primaryKey(),
    studentId: int("studentId")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    guardianId: int("guardianId")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    relationship: varchar("relationship", { length: 50 }),
    isPrimary: int("isPrimary").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("studentGuardians_student_guardian_uq").on(
      table.studentId,
      table.guardianId
    ),
    index("studentGuardians_student_idx").on(table.studentId),
    index("studentGuardians_guardian_idx").on(table.guardianId),
  ]
);

export const contacts = mysqlTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId").references(() => schools.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    school: varchar("school", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    students: varchar("students", { length: 50 }),
    message: text("message"),
    status: mysqlEnum("status", ["novo", "respondido", "descartado"])
      .default("novo")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("contacts_school_idx").on(table.schoolId)]
);

// Academic
export const subjects = mysqlTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 30 }),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("subjects_school_name_uq").on(table.schoolId, table.name),
    uniqueIndex("subjects_school_code_uq").on(table.schoolId, table.code),
    index("subjects_school_idx").on(table.schoolId),
  ]
);

export const classes = mysqlTable(
  "classes",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    schoolYearId: int("schoolYearId")
      .notNull()
      .references(() => schoolYears.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    gradeLabel: varchar("gradeLabel", { length: 50 }).notNull(),
    shift: mysqlEnum("shift", ["morning", "afternoon", "evening", "full_day"])
      .default("morning")
      .notNull(),
    status: mysqlEnum("status", ["ativo", "inativo", "encerrada"])
      .default("ativo")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("classes_year_name_uq").on(table.schoolYearId, table.name),
    index("classes_school_idx").on(table.schoolId),
    index("classes_year_idx").on(table.schoolYearId),
  ]
);

export const classSubjects = mysqlTable(
  "classSubjects",
  {
    id: serial("id").primaryKey(),
    classId: int("classId")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: int("subjectId")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("classSubjects_class_subject_uq").on(
      table.classId,
      table.subjectId
    ),
    index("classSubjects_class_idx").on(table.classId),
    index("classSubjects_subject_idx").on(table.subjectId),
  ]
);

export const classTeachers = mysqlTable(
  "classTeachers",
  {
    id: serial("id").primaryKey(),
    classSubjectId: int("classSubjectId")
      .notNull()
      .references(() => classSubjects.id, { onDelete: "cascade" }),
    teacherId: int("teacherId")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("classTeachers_classSubject_teacher_uq").on(
      table.classSubjectId,
      table.teacherId
    ),
    index("classTeachers_teacher_idx").on(table.teacherId),
  ]
);

export const classEnrollments = mysqlTable(
  "classEnrollments",
  {
    id: serial("id").primaryKey(),
    classId: int("classId")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: int("studentId")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    enrollmentDate: date("enrollmentDate").notNull(),
    status: mysqlEnum("status", ["ativo", "transferido", "concluido"])
      .default("ativo")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("classEnrollments_class_student_uq").on(
      table.classId,
      table.studentId
    ),
    index("classEnrollments_student_idx").on(table.studentId),
  ]
);

// Attendance and grading
export const classSessions = mysqlTable(
  "classSessions",
  {
    id: serial("id").primaryKey(),
    classSubjectId: int("classSubjectId")
      .notNull()
      .references(() => classSubjects.id, { onDelete: "cascade" }),
    teacherId: int("teacherId").references(() => teachers.id, {
      onDelete: "set null",
    }),
    lessonDate: date("lessonDate").notNull(),
    lessonNumber: int("lessonNumber").default(1).notNull(),
    topic: varchar("topic", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("classSessions_slot_uq").on(
      table.classSubjectId,
      table.lessonDate,
      table.lessonNumber
    ),
    index("classSessions_date_idx").on(table.lessonDate),
  ]
);

export const attendanceRecords = mysqlTable(
  "attendanceRecords",
  {
    id: serial("id").primaryKey(),
    classSessionId: int("classSessionId")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    studentId: int("studentId")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["present", "absent", "justified"])
      .default("present")
      .notNull(),
    reason: text("reason"),
    recordedByTeacherId: int("recordedByTeacherId").references(
      () => teachers.id,
      {
        onDelete: "set null",
      }
    ),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("attendanceRecords_session_student_uq").on(
      table.classSessionId,
      table.studentId
    ),
    index("attendanceRecords_student_idx").on(table.studentId),
    index("attendanceRecords_status_idx").on(table.status),
  ]
);

export const assessments = mysqlTable(
  "assessments",
  {
    id: serial("id").primaryKey(),
    classSubjectId: int("classSubjectId")
      .notNull()
      .references(() => classSubjects.id, { onDelete: "cascade" }),
    teacherId: int("teacherId").references(() => teachers.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    maxScore: decimal("maxScore", { precision: 5, scale: 2 })
      .default("10.00")
      .notNull(),
    weight: decimal("weight", { precision: 5, scale: 2 })
      .default("1.00")
      .notNull(),
    assessmentDate: date("assessmentDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    index("assessments_classSubject_idx").on(table.classSubjectId),
    index("assessments_date_idx").on(table.assessmentDate),
  ]
);

export const assessmentScores = mysqlTable(
  "assessmentScores",
  {
    id: serial("id").primaryKey(),
    assessmentId: int("assessmentId")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    studentId: int("studentId")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    score: decimal("score", { precision: 5, scale: 2 }).notNull(),
    feedback: text("feedback"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("assessmentScores_assessment_student_uq").on(
      table.assessmentId,
      table.studentId
    ),
    index("assessmentScores_student_idx").on(table.studentId),
  ]
);

// Comments, events and communication
export const studentComments = mysqlTable(
  "studentComments",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    studentId: int("studentId")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: int("teacherId").references(() => teachers.id, {
      onDelete: "set null",
    }),
    classSubjectId: int("classSubjectId").references(() => classSubjects.id, {
      onDelete: "set null",
    }),
    category: mysqlEnum("category", [
      "elogio",
      "melhoria",
      "ocorrencia",
      "comentario",
    ])
      .default("comentario")
      .notNull(),
    visibility: mysqlEnum("visibility", [
      "student",
      "guardian",
      "school",
      "all",
    ])
      .default("all")
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    index("studentComments_school_idx").on(table.schoolId),
    index("studentComments_student_idx").on(table.studentId),
    index("studentComments_category_idx").on(table.category),
    index("studentComments_createdAt_idx").on(table.createdAt),
  ]
);

export const schoolEvents = mysqlTable(
  "schoolEvents",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    eventType: mysqlEnum("eventType", [
      "prova",
      "feriado",
      "saida_antecipada",
      "evento_escolar",
      "reuniao",
    ])
      .default("evento_escolar")
      .notNull(),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt"),
    createdByUserId: int("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    index("schoolEvents_school_idx").on(table.schoolId),
    index("schoolEvents_startsAt_idx").on(table.startsAt),
  ]
);

export const eventTargets = mysqlTable(
  "eventTargets",
  {
    id: serial("id").primaryKey(),
    eventId: int("eventId")
      .notNull()
      .references(() => schoolEvents.id, { onDelete: "cascade" }),
    targetType: mysqlEnum("targetType", [
      "school",
      "class",
      "student",
      "guardian",
    ]).notNull(),
    targetRefId: int("targetRefId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("eventTargets_unique_target_uq").on(
      table.eventId,
      table.targetType,
      table.targetRefId
    ),
    index("eventTargets_target_idx").on(table.targetType, table.targetRefId),
  ]
);

export const communications = mysqlTable(
  "communications",
  {
    id: serial("id").primaryKey(),
    schoolId: int("schoolId")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    authorUserId: int("authorUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    communicationType: mysqlEnum("communicationType", [
      "announcement",
      "reminder",
      "alert",
    ])
      .default("announcement")
      .notNull(),
    relatedEventId: int("relatedEventId").references(() => schoolEvents.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    index("communications_school_idx").on(table.schoolId),
    index("communications_type_idx").on(table.communicationType),
  ]
);

export const communicationRecipients = mysqlTable(
  "communicationRecipients",
  {
    id: serial("id").primaryKey(),
    communicationId: int("communicationId")
      .notNull()
      .references(() => communications.id, { onDelete: "cascade" }),
    recipientType: mysqlEnum("recipientType", [
      "student",
      "guardian",
      "teacher",
      "staff",
    ]).notNull(),
    recipientRefId: int("recipientRefId").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("communicationRecipients_unique_uq").on(
      table.communicationId,
      table.recipientType,
      table.recipientRefId
    ),
    index("communicationRecipients_target_idx").on(
      table.recipientType,
      table.recipientRefId
    ),
  ]
);

export const attachments = mysqlTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    ownerType: mysqlEnum("ownerType", [
      "event",
      "communication",
      "comment",
    ]).notNull(),
    ownerId: int("ownerId").notNull(),
    fileUrl: varchar("fileUrl", { length: 2048 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 128 }),
    sizeBytes: int("sizeBytes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("attachments_owner_idx").on(table.ownerType, table.ownerId)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: mysqlEnum("notificationType", [
      "absence_alert",
      "grade_published",
      "event_reminder",
      "general",
    ])
      .default("general")
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    actionUrl: varchar("actionUrl", { length: 2048 }),
    isRead: int("isRead").default(0).notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.userId, table.isRead),
    index("notifications_createdAt_idx").on(table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;
export type SchoolYear = typeof schoolYears.$inferSelect;
export type InsertSchoolYear = typeof schoolYears.$inferInsert;
export type UserSchool = typeof userSchools.$inferSelect;
export type InsertUserSchool = typeof userSchools.$inferInsert;
export type SchoolStaffProfile = typeof schoolStaffProfiles.$inferSelect;
export type InsertSchoolStaffProfile = typeof schoolStaffProfiles.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;
export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = typeof guardians.$inferInsert;
export type StudentGuardian = typeof studentGuardians.$inferSelect;
export type InsertStudentGuardian = typeof studentGuardians.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = typeof classSubjects.$inferInsert;
export type ClassTeacher = typeof classTeachers.$inferSelect;
export type InsertClassTeacher = typeof classTeachers.$inferInsert;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = typeof classEnrollments.$inferInsert;
export type ClassSession = typeof classSessions.$inferSelect;
export type InsertClassSession = typeof classSessions.$inferInsert;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;
export type AssessmentScore = typeof assessmentScores.$inferSelect;
export type InsertAssessmentScore = typeof assessmentScores.$inferInsert;
export type StudentComment = typeof studentComments.$inferSelect;
export type InsertStudentComment = typeof studentComments.$inferInsert;
export type SchoolEvent = typeof schoolEvents.$inferSelect;
export type InsertSchoolEvent = typeof schoolEvents.$inferInsert;
export type EventTarget = typeof eventTargets.$inferSelect;
export type InsertEventTarget = typeof eventTargets.$inferInsert;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = typeof communications.$inferInsert;
export type CommunicationRecipient =
  typeof communicationRecipients.$inferSelect;
export type InsertCommunicationRecipient =
  typeof communicationRecipients.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;
