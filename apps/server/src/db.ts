import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./core/env";

// ── camelCase conversion (Supabase cloud DB uses camelCase columns) ──

// The Supabase cloud DB stores columns in camelCase (e.g. schoolId, createdAt).
// We do NOT convert to snake_case before inserts/updates, and we do NOT
// convert from snake_case after selects — the DB already returns camelCase.

// ── Supabase Client singleton ──────────────────────────────────

let _supabase: SupabaseClient | null = null;

function debugFetch(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    const start = performance.now();

    const res = await fetchImpl(input, init);

    const duration = Math.round(performance.now() - start);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[SUPABASE] ${init?.method ?? "GET"} ${input} - ${res.status} (${duration}ms)`
      );
    }

    return res;
  };
}

function getSupabase(): SupabaseClient | null {
  if (useMemoryStore()) return null;

  if (!_supabase && ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    _supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: debugFetch(fetch),
      },
    });
  }

  return _supabase;
}

const useMemoryStore = () =>
  process.env.NODE_ENV === "test" || !process.env.SUPABASE_URL;

// ── Types (camelCase, matching app expectations) ───────────────

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: string;
  defaultProfile: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "lastSignedIn"
> & {
  lastSignedIn?: Date;
};

export type School = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  studentCount: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertSchool = Omit<School, "id" | "createdAt" | "updatedAt">;

export type SchoolYear = {
  id: number;
  schoolId: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserSchool = {
  id: number;
  userId: number;
  schoolId: number;
  role: string;
  createdAt: Date;
};

export type InsertUserSchool = Omit<UserSchool, "id" | "createdAt">;

export type SchoolStaffProfile = {
  id: number;
  userId: number;
  schoolId: number;
  role: string;
  positionTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Teacher = {
  id: number;
  userId: number;
  schoolId: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  active: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Student = {
  id: number;
  userId: number | null;
  schoolId: number;
  enrollmentNumber: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  grade: string | null;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Guardian = {
  id: number;
  userId: number | null;
  schoolId: number;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Contact = {
  id: number;
  schoolId: number | null;
  name: string;
  email: string;
  school: string;
  role: string;
  students: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertContact = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export type Subject = {
  id: number;
  schoolId: number;
  name: string;
  code: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Class = {
  id: number;
  schoolId: number;
  schoolYearId: number;
  name: string;
  gradeLabel: string;
  course: string | null;
  code: string | null;
  shift: string;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassSubject = {
  id: number;
  classId: number;
  subjectId: number;
  createdAt: Date;
};

export type ClassTeacher = {
  id: number;
  classSubjectId: number;
  teacherId: number;
  createdAt: Date;
};

export type ClassEnrollment = {
  id: number;
  classId: number;
  studentId: number;
  enrollmentDate: string;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassSession = {
  id: number;
  classSubjectId: number;
  teacherId: number | null;
  lessonDate: string;
  lessonNumber: number;
  topic: string | null;
  notes: string | null;
  createdAt: Date;
};

export type AttendanceRecord = {
  id: number;
  classSessionId: number;
  studentId: number;
  status: string;
  reason: string | null;
  recordedByTeacherId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Assessment = {
  id: number;
  classSubjectId: number;
  teacherId: number | null;
  title: string;
  description: string | null;
  maxScore: string;
  weight: string;
  assessmentDate: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentScore = {
  id: number;
  assessmentId: number;
  studentId: number;
  score: string;
  feedback: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentComment = {
  id: number;
  schoolId: number;
  studentId: number;
  teacherId: number | null;
  classSubjectId: number | null;
  category: string;
  visibility: string;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SchoolEvent = {
  id: number;
  schoolId: number;
  title: string;
  description: string | null;
  eventType: string;
  startsAt: string;
  endsAt: string | null;
  createdByUserId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventTarget = {
  id: number;
  eventId: number;
  targetType: string;
  targetRefId: number;
  createdAt: Date;
};

export type Communication = {
  id: number;
  schoolId: number;
  authorUserId: number | null;
  title: string;
  body: string;
  communicationType: string;
  relatedEventId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommunicationRecipient = {
  id: number;
  communicationId: number;
  recipientType: string;
  recipientRefId: number;
  readAt: Date | null;
  createdAt: Date;
};

export type Notification = {
  id: number;
  userId: number;
  notificationType: string;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: number;
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
};

export type Attachment = {
  id: number;
  ownerType: string;
  ownerId: number;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
};

export type AbsenceJustification = {
  id: number;
  schoolId: number;
  attendanceRecordId: number;
  guardianId: number;
  reason: string;
  attachmentUrl: string | null;
  status: string;
  reviewedByUserId: number | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLog = {
  id: number;
  userId: number | null;
  action: string;
  entity: string;
  entityId: number | null;
  changes: string | null;
  schoolId: number | null;
  ipAddress: string | null;
  createdAt: Date;
};

export type SchoolPlatform = {
  id: number;
  schoolId: number;
  name: string;
  description: string | null;
  url: string;
  emoji: string | null;
  colorGradient: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ScheduleSlot = {
  id: number;
  schoolId: number;
  shift: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
};

export type Task = {
  id: number;
  classSubjectId: number;
  teacherId: number;
  title: string;
  description: string | null;
  taskType: string;
  dueDate: string;
  maxScore: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskSubmission = {
  id: number;
  taskId: number;
  studentId: number;
  answer: string | null;
  fileUrl: string | null;
  score: string | null;
  feedback: string | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// `studentGuardians` only existed as an inline type inside `MemoryStore`.
// Exporting it lets the registry row map (and the frontend) reference a
// concrete, named type instead of falling back to `unknown`/`RegistryRow`.
export type StudentGuardian = {
  id: number;
  studentId: number;
  guardianId: number;
  relationship: string | null;
  isPrimary: number;
  createdAt: Date;
};

// ── Memory Store ───────────────────────────────────────────────

type MemoryStore = {
  users: User[];
  contacts: Contact[];
  schools: School[];
  userSchools: UserSchool[];
  schoolStaffProfiles: SchoolStaffProfile[];
  schoolYears: Array<{
    id: number;
    schoolId: number;
    name: string;
    isCurrent: number;
  }>;
  teachers: Teacher[];
  students: Student[];
  guardians: Guardian[];
  studentGuardians: StudentGuardian[];
  subjects: Subject[];
  classes: Class[];
  classSubjects: ClassSubject[];
  classTeachers: ClassTeacher[];
  classEnrollments: Array<{
    id: number;
    classId: number;
    studentId: number;
    enrollmentDate: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  assessments: Array<{
    id: number;
    classSubjectId: number;
    teacherId: number | null;
    title: string;
    description: string | null;
    maxScore: string;
    weight: string;
    assessmentDate: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  assessmentScores: Array<{
    id: number;
    assessmentId: number;
    studentId: number;
    score: string;
    feedback: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  classSessions: Array<{
    id: number;
    classSubjectId: number;
    teacherId: number | null;
    lessonDate: string;
    lessonNumber: number;
    topic: string | null;
    notes: string | null;
    createdAt: Date;
  }>;
  attendanceRecords: AttendanceRecord[];
  studentComments: Array<{
    id: number;
    schoolId: number;
    studentId: number;
    teacherId: number | null;
    classSubjectId: number | null;
    category: string;
    visibility: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  communications: Communication[];
  communicationRecipients: CommunicationRecipient[];
  schoolEvents: SchoolEvent[];
  eventTargets: EventTarget[];
  notifications: Notification[];
  attachments: Attachment[];
  absenceJustifications: AbsenceJustification[];
  auditLogs: AuditLog[];
  schoolPlatforms: SchoolPlatform[];
  scheduleSlots: ScheduleSlot[];
  tasks: Array<{
    id: number;
    classSubjectId: number;
    teacherId: number;
    title: string;
    description: string | null;
    taskType: string;
    dueDate: string;
    maxScore: string;
    closedAt: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  taskSubmissions: Array<{
    id: number;
    taskId: number;
    studentId: number;
    answer: string | null;
    fileUrl: string | null;
    score: string | null;
    feedback: string | null;
    submittedAt: Date | null;
    gradedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

const memory: MemoryStore = {
  users: [],
  contacts: [],
  schools: [],
  userSchools: [],
  schoolStaffProfiles: [],
  schoolYears: [],
  teachers: [],
  students: [],
  guardians: [],
  studentGuardians: [],
  subjects: [],
  classes: [],
  classSubjects: [],
  classTeachers: [],
  classEnrollments: [],
  assessments: [],
  assessmentScores: [],
  classSessions: [],
  attendanceRecords: [],
  studentComments: [],
  communications: [],
  communicationRecipients: [],
  schoolEvents: [],
  eventTargets: [],
  notifications: [],
  attachments: [],
  absenceJustifications: [],
  auditLogs: [],
  schoolPlatforms: [],
  scheduleSlots: [],
  tasks: [],
  taskSubmissions: [],
};

const memoryIds = {
  users: 1,
  contacts: 1,
  schools: 1,
  userSchools: 1,
  schoolStaffProfiles: 1,
  schoolYears: 1,
  teachers: 1,
  students: 1,
  guardians: 1,
  studentGuardians: 1,
  subjects: 1,
  classes: 1,
  classSubjects: 1,
  classTeachers: 1,
  classEnrollments: 1,
  assessments: 1,
  assessmentScores: 1,
  classSessions: 1,
  attendanceRecords: 1,
  studentComments: 1,
  communications: 1,
  communicationRecipients: 1,
  schoolEvents: 1,
  eventTargets: 1,
  notifications: 1,
  attachments: 1,
  absenceJustifications: 1,
  auditLogs: 1,
  schoolPlatforms: 1,
  scheduleSlots: 1,
  tasks: 1,
  taskSubmissions: 1,
};

export function resetMemoryStore() {
  Object.assign(memory, {
    users: [],
    contacts: [],
    schools: [],
    userSchools: [],
    schoolStaffProfiles: [],
    schoolYears: [],
    teachers: [],
    students: [],
    guardians: [],
    studentGuardians: [],
    subjects: [],
    classes: [],
    classSubjects: [],
    classTeachers: [],
    classEnrollments: [],
    assessments: [],
    assessmentScores: [],
    classSessions: [],
    attendanceRecords: [],
    studentComments: [],
    communications: [],
    communicationRecipients: [],
    schoolEvents: [],
    eventTargets: [],
    notifications: [],
    attachments: [],
    absenceJustifications: [],
    auditLogs: [],
    schoolPlatforms: [],
    scheduleSlots: [],
    tasks: [],
    taskSubmissions: [],
  });
  Object.keys(memoryIds).forEach(key => {
    (memoryIds as Record<string, number>)[key] = 1;
  });
}

function getCurrentYearName() {
  return String(new Date().getFullYear());
}

// ── Registry: entity ↔ table name mapping ─────────────────────

// DB uses camelCase column names — entity mapping uses camelCase table names
const entityTableName = {
  users: "users",
  schools: "schools",
  schoolYears: "schoolYears",
  userSchools: "userSchools",
  schoolStaffProfiles: "schoolStaffProfiles",
  teachers: "teachers",
  students: "students",
  guardians: "guardians",
  studentGuardians: "studentGuardians",
  contacts: "contacts",
  subjects: "subjects",
  classes: "classes",
  classSubjects: "classSubjects",
  classTeachers: "classTeachers",
  classEnrollments: "classEnrollments",
  classSessions: "classSessions",
  attendanceRecords: "attendanceRecords",
  assessments: "assessments",
  assessmentScores: "assessmentScores",
  studentComments: "studentComments",
  schoolEvents: "schoolEvents",
  eventTargets: "eventTargets",
  communications: "communications",
  communicationRecipients: "communicationRecipients",
  notifications: "notifications",
  attachments: "attachments",
  absenceJustifications: "absenceJustifications",
  auditLogs: "auditLogs",
  schoolPlatforms: "schoolPlatforms",
  scheduleSlots: "scheduleSlots",
  tasks: "tasks",
  taskSubmissions: "taskSubmissions",
} as const;

export type RegistryEntityName = keyof typeof entityTableName;

// ── Registry: entity ↔ concrete row type mapping ───────────────
//
// This replaces the old pattern of typing every `registry.list` result as a
// single generic `RegistryRow`. With `RegistryEntityRowMap`, each entity
// resolves to its real shape (`Student`, `AttendanceRecord`, etc.), so
// `listEntityRows("students", ...)` returns `Student[]` instead of
// `unknown[]`/`RegistryRow[]`. Frontend components and tRPC routes can use
// `RegistryRowFor<"students">` to get full autocomplete + type safety
// without casts like `as RegistryRow[]`, `as number`, or `as string`.
export type RegistryEntityRowMap = {
  users: User;
  schools: School;
  schoolYears: SchoolYear;
  userSchools: UserSchool;
  schoolStaffProfiles: SchoolStaffProfile;
  teachers: Teacher;
  students: Student;
  guardians: Guardian;
  studentGuardians: StudentGuardian;
  contacts: Contact;
  subjects: Subject;
  classes: Class;
  classSubjects: ClassSubject;
  classTeachers: ClassTeacher;
  classEnrollments: ClassEnrollment;
  classSessions: ClassSession;
  attendanceRecords: AttendanceRecord;
  assessments: Assessment;
  assessmentScores: AssessmentScore;
  studentComments: StudentComment;
  schoolEvents: SchoolEvent;
  eventTargets: EventTarget;
  communications: Communication;
  communicationRecipients: CommunicationRecipient;
  notifications: Notification;
  attachments: Attachment;
  absenceJustifications: AbsenceJustification;
  auditLogs: AuditLog;
  schoolPlatforms: SchoolPlatform;
  scheduleSlots: ScheduleSlot;
  tasks: Task;
  taskSubmissions: TaskSubmission;
};

// Convenience alias for use in routers/components, e.g.
// `type Row = RegistryRowFor<"students">` instead of importing `Student`
// by hand — useful when the entity name is itself a generic parameter.
export type RegistryRowFor<E extends RegistryEntityName> =
  RegistryEntityRowMap[E];

// ── Registry: shared limit validation ──────────────────────────
//
// Single source of truth for the max page size `registry.list` accepts.
// The tRPC router's zod input schema should use this constant
// (e.g. `z.number().int().min(1).max(REGISTRY_MAX_LIMIT)`) so the frontend,
// the router validation, and the DB layer can never disagree about the
// limit — instead of the router rejecting with `BAD_REQUEST` while this
// file silently clamps to a different number.
export const REGISTRY_MAX_LIMIT = 500;
export const REGISTRY_DEFAULT_LIMIT = 100;

/** Clamp an untrusted/optional limit into the [1, REGISTRY_MAX_LIMIT] range. */
export function clampRegistryLimit(limit?: number): number {
  if (limit === undefined || Number.isNaN(limit)) return REGISTRY_DEFAULT_LIMIT;
  return Math.max(1, Math.min(REGISTRY_MAX_LIMIT, Math.trunc(limit)));
}

// Columns that exist in each table (camelCase — matches the actual DB schema)
const entityColumns: Record<RegistryEntityName, Set<string>> = {
  users: new Set([
    "id",
    "openId",
    "name",
    "email",
    "loginMethod",
    "role",
    "defaultProfile",
    "createdAt",
    "updatedAt",
    "lastSignedIn",
  ]),
  schools: new Set([
    "id",
    "name",
    "email",
    "phone",
    "address",
    "city",
    "state",
    "zipCode",
    "studentCount",
    "status",
    "createdAt",
    "updatedAt",
  ]),
  schoolYears: new Set([
    "id",
    "schoolId",
    "name",
    "startDate",
    "endDate",
    "isCurrent",
    "createdAt",
    "updatedAt",
  ]),
  userSchools: new Set(["id", "userId", "schoolId", "role", "createdAt"]),
  schoolStaffProfiles: new Set([
    "id",
    "userId",
    "schoolId",
    "role",
    "positionTitle",
    "createdAt",
    "updatedAt",
  ]),
  teachers: new Set([
    "id",
    "userId",
    "schoolId",
    "name",
    "email",
    "phone",
    "subject",
    "active",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  students: new Set([
    "id",
    "userId",
    "schoolId",
    "enrollmentNumber",
    "name",
    "email",
    "phone",
    "dateOfBirth",
    "grade",
    "status",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  guardians: new Set([
    "id",
    "userId",
    "schoolId",
    "name",
    "email",
    "phone",
    "relationship",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  studentGuardians: new Set([
    "id",
    "studentId",
    "guardianId",
    "relationship",
    "isPrimary",
    "createdAt",
  ]),
  contacts: new Set([
    "id",
    "schoolId",
    "name",
    "email",
    "school",
    "role",
    "students",
    "message",
    "status",
    "createdAt",
    "updatedAt",
  ]),
  subjects: new Set([
    "id",
    "schoolId",
    "name",
    "code",
    "description",
    "createdAt",
    "updatedAt",
  ]),
  classes: new Set([
    "id",
    "schoolId",
    "schoolYearId",
    "name",
    "gradeLabel",
    "course",
    "code",
    "shift",
    "status",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  classSubjects: new Set(["id", "classId", "subjectId", "createdAt"]),
  classTeachers: new Set(["id", "classSubjectId", "teacherId", "createdAt"]),
  classEnrollments: new Set([
    "id",
    "classId",
    "studentId",
    "enrollmentDate",
    "status",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  classSessions: new Set([
    "id",
    "classSubjectId",
    "teacherId",
    "lessonDate",
    "lessonNumber",
    "topic",
    "notes",
    "createdAt",
  ]),
  attendanceRecords: new Set([
    "id",
    "classSessionId",
    "studentId",
    "status",
    "reason",
    "recordedByTeacherId",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  assessments: new Set([
    "id",
    "classSubjectId",
    "teacherId",
    "title",
    "description",
    "maxScore",
    "weight",
    "assessmentDate",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  assessmentScores: new Set([
    "id",
    "assessmentId",
    "studentId",
    "score",
    "feedback",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  studentComments: new Set([
    "id",
    "schoolId",
    "studentId",
    "teacherId",
    "classSubjectId",
    "category",
    "visibility",
    "content",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  schoolEvents: new Set([
    "id",
    "schoolId",
    "title",
    "description",
    "eventType",
    "startsAt",
    "endsAt",
    "createdByUserId",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  eventTargets: new Set([
    "id",
    "eventId",
    "targetType",
    "targetRefId",
    "createdAt",
  ]),
  communications: new Set([
    "id",
    "schoolId",
    "authorUserId",
    "title",
    "body",
    "communicationType",
    "relatedEventId",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ]),
  communicationRecipients: new Set([
    "id",
    "communicationId",
    "recipientType",
    "recipientRefId",
    "readAt",
    "createdAt",
  ]),
  notifications: new Set([
    "id",
    "userId",
    "notificationType",
    "title",
    "body",
    "actionUrl",
    "isRead",
    "readAt",
    "deletedAt",
    "createdAt",
  ]),
  attachments: new Set([
    "id",
    "ownerType",
    "ownerId",
    "fileUrl",
    "fileName",
    "mimeType",
    "sizeBytes",
    "createdAt",
  ]),
  absenceJustifications: new Set([
    "id",
    "schoolId",
    "attendanceRecordId",
    "guardianId",
    "reason",
    "attachmentUrl",
    "status",
    "reviewedByUserId",
    "reviewedAt",
    "reviewNotes",
    "createdAt",
    "updatedAt",
  ]),
  auditLogs: new Set([
    "id",
    "userId",
    "action",
    "entity",
    "entityId",
    "changes",
    "schoolId",
    "ipAddress",
    "createdAt",
  ]),
  schoolPlatforms: new Set([
    "id",
    "schoolId",
    "name",
    "description",
    "url",
    "emoji",
    "colorGradient",
    "sortOrder",
    "createdAt",
    "updatedAt",
  ]),
  scheduleSlots: new Set([
    "id",
    "schoolId",
    "shift",
    "slotNumber",
    "startTime",
    "endTime",
    "createdAt",
  ]),
  tasks: new Set([
    "id",
    "classSubjectId",
    "teacherId",
    "title",
    "description",
    "taskType",
    "dueDate",
    "maxScore",
    "closedAt",
    "createdAt",
    "updatedAt",
  ]),
  taskSubmissions: new Set([
    "id",
    "taskId",
    "studentId",
    "answer",
    "fileUrl",
    "score",
    "feedback",
    "submittedAt",
    "gradedAt",
    "createdAt",
    "updatedAt",
  ]),
};

function hasColumn(entity: RegistryEntityName, col: string) {
  return entityColumns[entity]?.has(col) ?? false;
}

function sanitizeEntityPayload(
  entity: RegistryEntityName,
  payload: Record<string, unknown>,
  options: { isUpdate: boolean }
) {
  const allowed = entityColumns[entity];
  if (!allowed) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!allowed.has(key)) continue;
    if (options.isUpdate && key === "id") continue;
    sanitized[key] = value;
  }
  return sanitized;
}

// ── Memory Store helpers (unchanged logic) ─────────────────────

function getMemoryStoreByEntity(
  entity: RegistryEntityName
): Array<Record<string, unknown>> {
  switch (entity) {
    case "users":
      return memory.users as Array<Record<string, unknown>>;
    case "schools":
      return memory.schools as Array<Record<string, unknown>>;
    case "schoolYears":
      return memory.schoolYears as Array<Record<string, unknown>>;
    case "userSchools":
      return memory.userSchools as Array<Record<string, unknown>>;
    case "schoolStaffProfiles":
      return memory.schoolStaffProfiles as Array<Record<string, unknown>>;
    case "teachers":
      return memory.teachers as Array<Record<string, unknown>>;
    case "students":
      return memory.students as Array<Record<string, unknown>>;
    case "guardians":
      return memory.guardians as Array<Record<string, unknown>>;
    case "studentGuardians":
      return memory.studentGuardians as Array<Record<string, unknown>>;
    case "contacts":
      return memory.contacts as Array<Record<string, unknown>>;
    case "subjects":
      return memory.subjects as Array<Record<string, unknown>>;
    case "classes":
      return memory.classes as Array<Record<string, unknown>>;
    case "classSubjects":
      return memory.classSubjects as Array<Record<string, unknown>>;
    case "classTeachers":
      return memory.classTeachers as Array<Record<string, unknown>>;
    case "classEnrollments":
      return memory.classEnrollments as Array<Record<string, unknown>>;
    case "classSessions":
      return memory.classSessions as Array<Record<string, unknown>>;
    case "attendanceRecords":
      return memory.attendanceRecords as Array<Record<string, unknown>>;
    case "assessments":
      return memory.assessments as Array<Record<string, unknown>>;
    case "assessmentScores":
      return memory.assessmentScores as Array<Record<string, unknown>>;
    case "studentComments":
      return memory.studentComments as Array<Record<string, unknown>>;
    case "schoolEvents":
      return memory.schoolEvents as Array<Record<string, unknown>>;
    case "eventTargets":
      return memory.eventTargets as Array<Record<string, unknown>>;
    case "communications":
      return memory.communications as Array<Record<string, unknown>>;
    case "communicationRecipients":
      return memory.communicationRecipients as Array<Record<string, unknown>>;
    case "notifications":
      return memory.notifications as Array<Record<string, unknown>>;
    case "attachments":
      return memory.attachments as Array<Record<string, unknown>>;
    case "absenceJustifications":
      return memory.absenceJustifications as Array<Record<string, unknown>>;
    case "auditLogs":
      return memory.auditLogs as Array<Record<string, unknown>>;
    case "schoolPlatforms":
      return memory.schoolPlatforms as Array<Record<string, unknown>>;
    case "scheduleSlots":
      return memory.scheduleSlots as Array<Record<string, unknown>>;
    case "tasks":
      return memory.tasks as Array<Record<string, unknown>>;
    case "taskSubmissions":
      return memory.taskSubmissions as Array<Record<string, unknown>>;
    default: {
      const exhaustive: never = entity;
      throw new Error(`Unsupported entity: ${String(exhaustive)}`);
    }
  }
}

function applyMemoryEntityDefaults(
  entity: RegistryEntityName,
  row: Record<string, unknown>
) {
  const withDefault = <T>(key: string, value: T) => {
    if (row[key] === undefined) row[key] = value;
  };
  switch (entity) {
    case "users":
      withDefault("role", "user");
      break;
    case "schools":
      withDefault("status", "trial");
      break;
    case "schoolYears":
      withDefault("isCurrent", 0);
      break;
    case "userSchools":
      withDefault("role", "coordinator");
      break;
    case "teachers":
      withDefault("active", 1);
      break;
    case "students":
      withDefault("status", "ativo");
      break;
    case "studentGuardians":
      withDefault("isPrimary", 0);
      break;
    case "contacts":
      withDefault("status", "novo");
      break;
    case "classes":
      withDefault("shift", "morning");
      withDefault("status", "ativo");
      break;
    case "classEnrollments":
      withDefault("status", "ativo");
      break;
    case "classSessions":
      withDefault("lessonNumber", 1);
      break;
    case "attendanceRecords":
      withDefault("status", "present");
      break;
    case "assessments":
      withDefault("maxScore", "10.00");
      withDefault("weight", "1.00");
      break;
    case "studentComments":
      withDefault("category", "comentario");
      withDefault("visibility", "all");
      break;
    case "schoolEvents":
      withDefault("eventType", "evento_escolar");
      break;
    case "communications":
      withDefault("communicationType", "announcement");
      break;
    case "notifications":
      withDefault("notificationType", "general");
      withDefault("isRead", 0);
      break;
    case "tasks":
      withDefault("maxScore", "10.00");
      break;
    default:
      break;
  }
}

function rowMatchesFilters(
  row: Record<string, unknown>,
  filters: Record<string, unknown> | undefined
) {
  if (!filters) return true;
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined) return true;
    const rowValue = row[key];
    if (Array.isArray(value))
      return value.includes(rowValue as string | number | boolean);
    if (value === "not_null")
      return rowValue !== null && rowValue !== undefined;
    return rowValue === value;
  });
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value))
    return Math.trunc(value);
  if (typeof value === "string" && value.trim().length > 0) {
    const p = Number(value);
    if (Number.isFinite(p)) return Math.trunc(p);
  }
  return null;
}

// ── Memory seed helpers (unchanged) ────────────────────────────

async function ensureSchoolYearExists(schoolId: number) {
  if (useMemoryStore()) {
    const current = memory.schoolYears.find(
      sy => sy.schoolId === schoolId && sy.isCurrent === 1
    );
    if (current) return current.id;
    const id = memoryIds.schoolYears++;
    memory.schoolYears.push({
      id,
      schoolId,
      name: getCurrentYearName(),
      isCurrent: 1,
    });
    return id;
  }
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("schoolYears")
    .select("id")
    .eq("schoolId", schoolId)
    .eq("isCurrent", 1)
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  const now = new Date();
  const startDate = `${now.getFullYear()}-01-01`;
  const endDate = `${now.getFullYear()}-12-31`;
  const { data: created } = await supabase
    .from("schoolYears")
    .insert({
      schoolId,
      name: getCurrentYearName(),
      startDate,
      endDate,
      isCurrent: 1,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}

function seedSchoolPlatforms(schoolId: number) {
  const defaults = [
    {
      name: "Google Classroom",
      description: "Acesse suas turmas, tarefas e materiais digitais.",
      url: "https://classroom.google.com",
      emoji: "📚",
      colorGradient: "from-blue-500 to-blue-700",
      sortOrder: 0,
    },
    {
      name: "SISEDU",
      description: "Sistema de Gestão Educacional do Ceará.",
      url: "https://sisedu.educacao.ce.gov.br",
      emoji: "🏫",
      colorGradient: "from-green-500 to-green-700",
      sortOrder: 1,
    },
    {
      name: "SIC",
      description: "Consultas e informações do sistema educacional.",
      url: "https://sic.ceara.gov.br",
      emoji: "📋",
      colorGradient: "from-amber-500 to-amber-700",
      sortOrder: 2,
    },
    {
      name: "Enem na Rede",
      description: "Plataforma de preparação para o ENEM.",
      url: "https://enemnapoliedro.com.br",
      emoji: "🎯",
      colorGradient: "from-purple-500 to-purple-700",
      sortOrder: 3,
    },
    {
      name: "Conexão Educação",
      description: "Recursos educacionais e formação continuada.",
      url: "https://conexaoeducacao.educacao.ce.gov.br",
      emoji: "🌐",
      colorGradient: "from-red-500 to-red-700",
      sortOrder: 4,
    },
  ];
  for (const p of defaults) {
    const exists = memory.schoolPlatforms.some(
      sp => sp.schoolId === schoolId && sp.name === p.name
    );
    if (exists) continue;
    memory.schoolPlatforms.push({
      id: memoryIds.schoolPlatforms++,
      schoolId,
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

function seedScheduleSlots(schoolId: number) {
  const shifts = ["morning"];
  const slots = [
    { slotNumber: 1, startTime: "07:00", endTime: "07:45" },
    { slotNumber: 2, startTime: "07:45", endTime: "08:30" },
    { slotNumber: 3, startTime: "08:30", endTime: "09:15" },
    { slotNumber: 4, startTime: "09:30", endTime: "10:15" },
    { slotNumber: 5, startTime: "10:15", endTime: "11:00" },
    { slotNumber: 6, startTime: "11:00", endTime: "11:45" },
  ];
  for (const shift of shifts) {
    for (const slot of slots) {
      const exists = memory.scheduleSlots.some(
        s =>
          s.schoolId === schoolId &&
          s.shift === shift &&
          s.slotNumber === slot.slotNumber
      );
      if (exists) continue;
      memory.scheduleSlots.push({
        id: memoryIds.scheduleSlots++,
        schoolId,
        shift,
        ...slot,
        createdAt: new Date(),
      });
    }
  }
}

function seedTeacherAcademicDataInMemory(
  teacherId: number,
  schoolId: number,
  subjectName?: string
) {
  const schoolYearId =
    memory.schoolYears.find(x => x.schoolId === schoolId && x.isCurrent === 1)
      ?.id ??
    (() => {
      const id = memoryIds.schoolYears++;
      memory.schoolYears.push({
        id,
        schoolId,
        name: getCurrentYearName(),
        isCurrent: 1,
      });
      return id;
    })();
  const subjectId = (() => {
    const found = memory.subjects.find(
      s => s.schoolId === schoolId && s.name === (subjectName || "Matematica")
    );
    if (found) return found.id;
    const id = memoryIds.subjects++;
    memory.subjects.push({
      id,
      schoolId,
      name: subjectName || "Matematica",
      code: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  })();
  const classId = (() => {
    const ec = memory.classes.find(
      c =>
        c.schoolId === schoolId &&
        c.name === "6A" &&
        c.schoolYearId === schoolYearId
    );
    if (ec) return ec.id;
    const id = memoryIds.classes++;
    memory.classes.push({
      id,
      schoolId,
      schoolYearId,
      name: "6A",
      gradeLabel: "6o Ano A",
      course: null,
      code: null,
      shift: "morning",
      status: "ativo",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  })();
  const classSubjectId = (() => {
    const found = memory.classSubjects.find(
      cs => cs.classId === classId && cs.subjectId === subjectId
    );
    if (found) return found.id;
    const id = memoryIds.classSubjects++;
    memory.classSubjects.push({
      id,
      classId,
      subjectId,
      createdAt: new Date(),
    });
    return id;
  })();
  if (
    !memory.classTeachers.some(
      ct => ct.classSubjectId === classSubjectId && ct.teacherId === teacherId
    )
  ) {
    memory.classTeachers.push({
      id: memoryIds.classTeachers++,
      classSubjectId,
      teacherId,
      createdAt: new Date(),
    });
  }
}

function seedStudentAcademicDataInMemory(studentId: number, schoolId: number) {
  const classInSchool = memory.classes.find(c => c.schoolId === schoolId);
  if (!classInSchool) return;
  if (
    !memory.classEnrollments.some(
      e => e.classId === classInSchool.id && e.studentId === studentId
    )
  ) {
    memory.classEnrollments.push({
      id: memoryIds.classEnrollments++,
      classId: classInSchool.id,
      studentId,
      enrollmentDate: new Date().toISOString().slice(0, 10),
      status: "ativo",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  const classSubject = memory.classSubjects.find(
    cs => cs.classId === classInSchool.id
  );
  if (!classSubject) return;
  const teacherId =
    memory.classTeachers.find(ct => ct.classSubjectId === classSubject.id)
      ?.teacherId ?? null;
  const assessmentId = (() => {
    const existing = memory.assessments.find(
      a => a.classSubjectId === classSubject.id
    );
    if (existing) return existing.id;
    const id = memoryIds.assessments++;
    memory.assessments.push({
      id,
      classSubjectId: classSubject.id,
      teacherId,
      title: "Avaliacao Diagnostica",
      description: null,
      maxScore: "10.00",
      weight: "1.00",
      assessmentDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  })();
  if (
    !memory.assessmentScores.some(
      s => s.assessmentId === assessmentId && s.studentId === studentId
    )
  ) {
    memory.assessmentScores.push({
      id: memoryIds.assessmentScores++,
      assessmentId,
      studentId,
      score: "8.50",
      feedback: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  const classSessionId = (() => {
    const existing = memory.classSessions.find(
      cs => cs.classSubjectId === classSubject.id
    );
    if (existing) return existing.id;
    const id = memoryIds.classSessions++;
    memory.classSessions.push({
      id,
      classSubjectId: classSubject.id,
      teacherId,
      lessonDate: new Date().toISOString().slice(0, 10),
      lessonNumber: 1,
      topic: "Revisao",
      notes: null,
      createdAt: new Date(),
    });
    return id;
  })();
  if (
    !memory.attendanceRecords.some(
      ar => ar.classSessionId === classSessionId && ar.studentId === studentId
    )
  ) {
    memory.attendanceRecords.push({
      id: memoryIds.attendanceRecords++,
      classSessionId,
      studentId,
      status: "present",
      reason: null,
      recordedByTeacherId: teacherId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// ── Supabase query helpers ─────────────────────────────────────

async function supaSelectOne<T>(
  table: string,
  query: Record<string, unknown>
): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  let q = supabase.from(table).select().limit(1);
  for (const [key, value] of Object.entries(query)) {
    if (value === null) {
      q = q.is(key, null);
    } else {
      q = q.eq(key, value);
    }
  }
  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;
  return data[0] as T;
}

async function supaInsert<T>(
  table: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: created, error } = await supabase
    .from(table)
    .insert(data)
    .select();
  if (error || !created || created.length === 0) {
    if (error) console.error("[DB] supaInsert error:", error.message);
    return null;
  }
  return created[0] as T;
}

async function supaUpdate<T>(
  table: string,
  id: number,
  data: Record<string, unknown>
): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: updated, error } = await supabase
    .from(table)
    .update(data)
    .eq("id", id)
    .select();
  if (error || !updated || updated.length === 0) return null;
  return updated[0] as T;
}

// ── Exported DB functions ───────────────────────────────────────

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<void> {
  if (useMemoryStore()) {
    if (!user.openId) throw new Error("User openId is required for upsert");
    const existingIndex = memory.users.findIndex(
      entry => entry.openId === user.openId
    );
    const now = new Date();
    const baseUser: User = {
      id:
        existingIndex >= 0
          ? memory.users[existingIndex]!.id
          : memoryIds.users++,
      openId: user.openId,
      email: user.email ?? null,
      name: user.name ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      defaultProfile: user.defaultProfile ?? null,
      createdAt:
        existingIndex >= 0 ? memory.users[existingIndex]!.createdAt : now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    if (existingIndex >= 0) {
      memory.users[existingIndex] = {
        ...memory.users[existingIndex]!,
        ...baseUser,
      };
    } else {
      memory.users.push(baseUser);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase || !user.openId) return;

  const existing = await supaSelectOne<User>("users", { openId: user.openId });

  if (existing) {
    // Partial update — only touch fields explicitly provided, never downgrade role
    const update: Record<string, unknown> = {
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };
    if (user.name !== undefined) update.name = user.name;
    if (user.email !== undefined) update.email = user.email;
    if (user.loginMethod !== undefined) update.loginMethod = user.loginMethod;
    if (user.defaultProfile !== undefined) update.defaultProfile = user.defaultProfile;
    if (user.role !== undefined) update.role = user.role;

    const { error } = await supabase
      .from("users")
      .update(update)
      .eq("openId", user.openId);
    if (error) console.error("[DB] upsertUser update error:", error.message);
  } else {
    const payload = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      defaultProfile: user.defaultProfile ?? null,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };
    const { error } = await supabase
      .from("users")
      .insert(payload);
    if (error) console.error("[DB] upsertUser insert error:", error.message);
  }
}

export async function getUserByOpenId(openId: string) {
  if (useMemoryStore())
    return memory.users.find(user => user.openId === openId);
  return await supaSelectOne<User>("users", { openId });
}

export async function getUserByEmail(email: string) {
  if (useMemoryStore())
    return memory.users.find(user => user.email === email) ?? null;
  return await supaSelectOne<User>("users", { email });
}

export async function getUsersWithoutSupabaseAuth(): Promise<User[]> {
  if (useMemoryStore())
    return memory.users.filter(u => !u.openId.startsWith("supabase:"));
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("users")
    .select()
    .not("openId", "like", "supabase:%")
    .not("email", "is", null);
  return (data ?? []) as User[];
}

export async function linkUserOpenId(userId: number, newOpenId: string) {
  if (useMemoryStore()) {
    const u = memory.users.find(u => u.id === userId);
    if (u) u.openId = newOpenId;
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("users").update({ openId: newOpenId }).eq("id", userId);
}

export async function createContact(
  contact: InsertContact
): Promise<Contact | null> {
  if (useMemoryStore()) {
    const created: Contact = {
      id: memoryIds.contacts++,
      schoolId: contact.schoolId ?? null,
      name: contact.name,
      email: contact.email,
      school: contact.school,
      role: contact.role,
      students: contact.students ?? null,
      message: contact.message ?? null,
      status: contact.status ?? "novo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.contacts.push(created);
    return created;
  }
  return await supaInsert<Contact>("contacts", { ...contact });
}

export async function getContacts(limit: number = 50, offset: number = 0) {
  if (useMemoryStore()) return memory.contacts.slice(offset, offset + limit);
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .order("createdAt", { ascending: false })
    .range(offset, offset + limit - 1);
  return data ? (data as Contact[]) : [];
}

export async function createSchool(
  school: InsertSchool
): Promise<School | null> {
  if (useMemoryStore()) {
    const created: School = {
      id: memoryIds.schools++,
      name: school.name,
      email: school.email,
      phone: school.phone ?? null,
      address: school.address ?? null,
      city: school.city ?? null,
      state: school.state ?? null,
      zipCode: school.zipCode ?? null,
      studentCount: school.studentCount ?? null,
      status: school.status ?? "trial",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.schools.push(created);
    await ensureSchoolYearExists(created.id);
    seedSchoolPlatforms(created.id);
    seedScheduleSlots(created.id);
    return created;
  }
  const created = await supaInsert<School>("schools", { ...school });
  if (created) await ensureSchoolYearExists(created.id);
  return created;
}

export async function getSchoolByEmail(
  email: string
): Promise<School | undefined> {
  if (useMemoryStore())
    return memory.schools.find(school => school.email === email);
  const result = await supaSelectOne<School>("schools", { email });
  return result ?? undefined;
}

export async function getUserSchools(
  userId: number
): Promise<(UserSchool & { school: School })[]> {
  if (useMemoryStore()) {
    return memory.userSchools
      .filter(us => us.userId === userId)
      .map(us => ({
        ...us,
        school: memory.schools.find(school => school.id === us.schoolId)!,
      }))
      .filter(entry => Boolean(entry.school));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("userSchools")
    .select("*, schools:schoolId(*)")
    .eq("userId", userId);
  if (!data) return [];
  return data.map(row => {
    const camelRow = row as UserSchool;
    const schoolData = (row as Record<string, unknown>).schools as Record<
      string,
      unknown
    >;
    return { ...camelRow, school: schoolData as School };
  });
}

export async function createUserSchool(
  userSchool: InsertUserSchool
): Promise<UserSchool | null> {
  if (useMemoryStore()) {
    const existing = memory.userSchools.find(
      us =>
        us.userId === userSchool.userId && us.schoolId === userSchool.schoolId
    );
    if (existing) return existing;
    const created: UserSchool = {
      id: memoryIds.userSchools++,
      userId: userSchool.userId,
      schoolId: userSchool.schoolId,
      role: userSchool.role ?? "coordinator",
      createdAt: new Date(),
    };
    memory.userSchools.push(created);
    return created;
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("userSchools")
    .upsert({ ...userSchool }, { onConflict: "userId,schoolId" })
    .select();
  if (error || !data || data.length === 0) return null;
  return data[0] as UserSchool;
}

export async function getSchoolContacts(schoolId: number): Promise<Contact[]> {
  if (useMemoryStore())
    return memory.contacts.filter(c => c.schoolId === schoolId).slice(0, 100);
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("schoolId", schoolId)
    .order("createdAt", { ascending: false })
    .limit(100);
  return data ? (data as Contact[]) : [];
}

export async function createTeacherProfile(input: {
  userId: number;
  schoolId: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
}) {
  if (useMemoryStore()) {
    const existing = memory.teachers.find(
      t => t.userId === input.userId && t.schoolId === input.schoolId
    );
    if (existing) return existing;
    const created: Teacher = {
      id: memoryIds.teachers++,
      userId: input.userId,
      schoolId: input.schoolId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      active: 1,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.teachers.push(created);
    seedTeacherAcademicDataInMemory(
      created.id,
      created.schoolId,
      created.subject ?? undefined
    );
    return created;
  }
  return await supaInsert<Teacher>("teachers", { ...input, active: 1 });
}

export async function createGuardianProfile(input: {
  userId: number;
  schoolId: number;
  name: string;
  email: string;
  phone?: string | null;
  relationship?: string | null;
}) {
  if (useMemoryStore()) {
    const existing = memory.guardians.find(
      g => g.userId === input.userId && g.schoolId === input.schoolId
    );
    if (existing) return existing;
    const created: Guardian = {
      id: memoryIds.guardians++,
      userId: input.userId,
      schoolId: input.schoolId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      relationship: input.relationship ?? null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.guardians.push(created);
    return created;
  }
  return await supaInsert<Guardian>("guardians", { ...input });
}

export async function createSchoolStaffProfile(input: {
  userId: number;
  schoolId: number;
  role: "admin" | "director" | "coordinator";
  positionTitle?: string | null;
}) {
  if (useMemoryStore()) {
    const existingProfile = memory.schoolStaffProfiles.find(
      p =>
        p.userId === input.userId &&
        p.schoolId === input.schoolId &&
        p.role === input.role
    );
    if (existingProfile) return existingProfile;
    const createdProfile: SchoolStaffProfile = {
      id: memoryIds.schoolStaffProfiles++,
      userId: input.userId,
      schoolId: input.schoolId,
      role: input.role,
      positionTitle: input.positionTitle ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.schoolStaffProfiles.push(createdProfile);
    const role =
      input.role === "coordinator"
        ? "coordinator"
        : input.role === "director"
          ? "director"
          : "admin";
    const createdUserSchool: UserSchool = {
      id: memoryIds.userSchools++,
      userId: input.userId,
      schoolId: input.schoolId,
      role,
      createdAt: new Date(),
    };
    memory.userSchools.push(createdUserSchool);
    return createdProfile;
  }
  await supaInsert<SchoolStaffProfile>("schoolStaffProfiles", { ...input });
  return await createUserSchool({
    userId: input.userId,
    schoolId: input.schoolId,
    role:
      input.role === "coordinator"
        ? "coordinator"
        : input.role === "director"
          ? "director"
          : "admin",
  });
}

export async function createStudentProfile(input: {
  schoolId: number;
  userId?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  grade?: string | null;
}) {
  if (useMemoryStore()) {
    const created: Student = {
      id: memoryIds.students++,
      userId: input.userId ?? null,
      schoolId: input.schoolId,
      enrollmentNumber: `MAT-${Date.now()}-${memoryIds.students}`,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      dateOfBirth: null,
      grade: input.grade ?? null,
      status: "ativo",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.students.push(created);
    seedStudentAcademicDataInMemory(created.id, created.schoolId);
    return created;
  }
  return await supaInsert<Student>("students", {
    userId: input.userId ?? null,
    schoolId: input.schoolId,
    enrollmentNumber: `MAT-${Date.now()}-${Math.round(Math.random() * 9999)}`,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    grade: input.grade ?? null,
    status: "ativo",
  });
}

export async function linkStudentGuardian(input: {
  studentId: number;
  guardianId: number;
  relationship?: string | null;
  isPrimary?: number;
}) {
  if (useMemoryStore()) {
    const existing = memory.studentGuardians.find(
      sg =>
        sg.studentId === input.studentId && sg.guardianId === input.guardianId
    );
    if (existing) return existing;
    const created = {
      id: memoryIds.studentGuardians++,
      studentId: input.studentId,
      guardianId: input.guardianId,
      relationship: input.relationship ?? null,
      isPrimary: input.isPrimary ?? 0,
      createdAt: new Date(),
    };
    memory.studentGuardians.push(created);
    return created;
  }
  return await supaInsert("studentGuardians", {
    ...input,
    isPrimary: input.isPrimary ?? 0,
  });
}

export async function createStudentComment(input: {
  schoolId: number;
  studentId: number;
  teacherId?: number | null;
  classSubjectId?: number | null;
  category?: string;
  visibility?: string;
  content: string;
}) {
  if (useMemoryStore()) {
    const created = {
      id: memoryIds.studentComments++,
      schoolId: input.schoolId,
      studentId: input.studentId,
      teacherId: input.teacherId ?? null,
      classSubjectId: input.classSubjectId ?? null,
      category: input.category ?? "comentario",
      visibility: input.visibility ?? "all",
      content: input.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.studentComments.push(created);
    return created;
  }
  return await supaInsert<StudentComment>("studentComments", {
    ...input,
    category: input.category ?? "comentario",
    visibility: input.visibility ?? "all",
  });
}

export async function createAttendanceRecord(input: {
  classSessionId: number;
  studentId: number;
  status: string;
  reason?: string | null;
  recordedByTeacherId: number;
}) {
  if (useMemoryStore()) {
    const created = {
      id: memoryIds.attendanceRecords++,
      classSessionId: input.classSessionId,
      studentId: input.studentId,
      status: input.status,
      reason: input.reason ?? null,
      recordedByTeacherId: input.recordedByTeacherId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.attendanceRecords.push(created);
    return created;
  }
  return await supaInsert<AttendanceRecord>("attendanceRecords", { ...input });
}

export async function createAssessmentScore(input: {
  assessmentId: number;
  studentId: number;
  score: number | string;
  feedback?: string | null;
}) {
  if (useMemoryStore()) {
    const created: AssessmentScore = {
      id: memoryIds.assessmentScores++,
      assessmentId: input.assessmentId,
      studentId: input.studentId,
      score: String(input.score),
      feedback: input.feedback ?? null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.assessmentScores.push(created);
    return created;
  }
  return await supaInsert<AssessmentScore>("assessmentScores", {
    ...input,
    score:
      typeof input.score === "string" ? parseFloat(input.score) : input.score,
  });
}

export async function getAttendanceRecordsBySession(sessionId: number) {
  if (useMemoryStore())
    return memory.attendanceRecords.filter(r => r.classSessionId === sessionId);
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("attendanceRecords")
    .select("*, students:studentId(name)")
    .eq("classSessionId", sessionId)
    .order("name", { referencedTable: "students", ascending: true });
  if (!data) return [];
  return data.map(row => {
    const camel = row as Record<string, unknown> as AttendanceRecord;
    const studentData = (row as Record<string, unknown>).students as Record<
      string,
      unknown
    >;
    return { ...camel, studentName: studentData?.name ?? null };
  });
}

export async function getStudentCommentsForViewer(
  studentId: number,
  viewer: "student" | "guardian" | "school"
) {
  if (useMemoryStore()) {
    return memory.studentComments
      .filter(c => c.studentId === studentId)
      .filter(c => {
        if (viewer === "student")
          return c.visibility === "student" || c.visibility === "all";
        if (viewer === "guardian")
          return c.visibility === "guardian" || c.visibility === "all";
        return true;
      })
      .map(c => {
        const teacher = memory.teachers.find(t => t.id === c.teacherId);
        return {
          id: c.id,
          category: c.category,
          content: c.content,
          createdAt: c.createdAt,
          author: viewer === "student" ? null : (teacher?.name ?? null),
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  let visibilityFilter: string;
  if (viewer === "student")
    visibilityFilter = "or(visibility.eq.student,visibility.eq.all)";
  else if (viewer === "guardian")
    visibilityFilter = "or(visibility.eq.guardian,visibility.eq.all)";
  else visibilityFilter = "";
  let query = supabase
    .from("studentComments")
    .select(
      "id, category, content, createdAt, visibility, teachers:teacherId(name)"
    )
    .eq("studentId", studentId);
  if (visibilityFilter) query = query.or(visibilityFilter);
  const { data } = await query.order("createdAt", { ascending: false });
  if (!data) return [];
  return data.map(row => {
    const r = row as Record<string, unknown>;
    const teacherData = r.teachers as Record<string, unknown> | null;
    return {
      id: r.id as number,
      category: r.category as string,
      content: r.content as string,
      createdAt: new Date(r.createdAt as string),
      author:
        viewer === "student" ? null : ((teacherData?.name as string) ?? null),
    };
  });
}

export async function getTeacherProfile(userId: number) {
  if (useMemoryStore()) {
    const teacher = memory.teachers.find(t => t.userId === userId);
    if (!teacher) return null;
    const school = memory.schools.find(s => s.id === teacher.schoolId);
    const teacherClasses = await getTeacherClasses(userId);
    const totalStudents = teacherClasses.reduce(
      (acc, curr) => acc + curr.students,
      0
    );
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      school: school?.name ?? null,
      schoolId: teacher.schoolId,
      classes: teacherClasses,
      students: totalStudents,
    };
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("teachers")
    .select("*, schools:schoolId(name)")
    .eq("userId", userId)
    .limit(1);
  if (!data || data.length === 0) return null;
  const row = data[0] as Record<string, unknown>;
  const teacher = row as Teacher;
  const schoolData = row.schools as Record<string, unknown>;
  const teacherClasses = await getTeacherClasses(userId);
  const totalStudents = teacherClasses.reduce(
    (acc, curr) => acc + curr.students,
    0
  );
  return {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    subject: teacher.subject,
    school: (schoolData?.name as string) ?? null,
    schoolId: teacher.schoolId,
    classes: teacherClasses,
    students: totalStudents,
  };
}

export async function getTeacherClasses(userId: number) {
  const teacherRows = await listEntityRows("teachers", {
    filters: { userId },
    limit: 1,
  });
  if (!teacherRows.length) return [];
  const teacher = teacherRows[0] as Record<string, unknown>;
  const teacherId = teacher.id as number;

  const classTeachers = await listEntityRows("classTeachers", {
    filters: { teacherId },
    limit: 50,
  });
  if (!classTeachers.length) return [];

  const csIds = classTeachers.map(
    (ct: Record<string, unknown>) => ct.classSubjectId as number
  );

  const classSubjects = await listEntityRows("classSubjects", {
    filters: { id: csIds },
    limit: csIds.length,
  });

  const classIds = Array.from(
    new Set(classSubjects.map((cs: Record<string, unknown>) => cs.classId as number))
  );
  const subjectIds = Array.from(
    new Set(classSubjects.map((cs: Record<string, unknown>) => cs.subjectId as number))
  );

  const [classes, subjects, enrollments] = await Promise.all([
    classIds.length > 0
      ? listEntityRows("classes", { filters: { id: classIds }, limit: classIds.length })
      : Promise.resolve([]),
    subjectIds.length > 0
      ? listEntityRows("subjects", { filters: { id: subjectIds }, limit: subjectIds.length })
      : Promise.resolve([]),
    classIds.length > 0
      ? listEntityRows("classEnrollments", {
          filters: { classId: classIds, status: "ativo" },
          limit: 1000,
        })
      : Promise.resolve([]),
  ]);

  const classMap = new Map(
    classes.map((c: Record<string, unknown>) => [c.id as number, c])
  );
  const subjectMap = new Map(
    subjects.map((s: Record<string, unknown>) => [s.id as number, s])
  );
  const enrollMap = new Map<number, number>();
  for (const e of enrollments) {
    const cid = (e as Record<string, unknown>).classId as number;
    enrollMap.set(cid, (enrollMap.get(cid) ?? 0) + 1);
  }

  return classSubjects.map((cs: Record<string, unknown>) => {
    const csId = cs.id as number;
    const classId = cs.classId as number;
    const subjectId = cs.subjectId as number;
    const cls = classMap.get(classId) as Record<string, unknown> | undefined;
    const sub = subjectMap.get(subjectId) as Record<string, unknown> | undefined;

    const gradeLabel = (cls?.gradeLabel as string) ?? "";
    const course = (cls?.course as string) ?? "";
    const displayName = course ? `${gradeLabel} - ${course}` : gradeLabel;

    return {
      id: classId,
      classSubjectId: csId,
      name: (cls?.name as string) ?? "",
      gradeLabel,
      course,
      displayName,
      subject: (sub?.name as string) ?? course,
      shift: (cls?.shift as string) ?? "",
      students: enrollMap.get(classId) ?? 0,
    };
  });
}

export async function getTeacherClassGrades(userId: number, classId: number) {
  if (useMemoryStore()) {
    const teacher = memory.teachers.find(t => t.userId === userId);
    if (!teacher) return [];
    const allowedCSIds = memory.classTeachers
      .filter(ct => ct.teacherId === teacher.id)
      .map(ct => ct.classSubjectId);
    const csIds = memory.classSubjects
      .filter(cs => cs.classId === classId && allowedCSIds.includes(cs.id))
      .map(cs => cs.id);
    if (csIds.length === 0) return [];
    const aIds = memory.assessments
      .filter(a => csIds.includes(a.classSubjectId))
      .map(a => a.id);
    return memory.assessmentScores
      .filter(s => aIds.includes(s.assessmentId))
      .map(s => {
        const a = memory.assessments.find(a2 => a2.id === s.assessmentId)!;
        const st = memory.students.find(s2 => s2.id === s.studentId)!;
        return {
          assessmentId: a.id,
          assessmentTitle: a.title,
          studentId: st.id,
          studentName: st.name,
          grade: Number(s.score),
          date: a.assessmentDate,
        };
      });
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_teacher_class_grades", {
    p_user_id: userId,
    p_class_id: classId,
  });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(row => {
    const camel = row as Record<string, unknown>;
    return {
      ...camel,
      grade: Number((camel as Record<string, unknown>).grade),
    };
  });
}

export async function getStudentProfile(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return null;
    const school = memory.schools.find(s => s.id === student.schoolId);
    const scores = memory.assessmentScores.filter(
      s => s.studentId === student.id
    );
    const average =
      scores.length > 0
        ? scores.reduce((acc, item) => acc + Number(item.score), 0) /
          scores.length
        : 0;
    const absences = memory.attendanceRecords.filter(
      a => a.studentId === student.id && a.status === "absent"
    ).length;
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: (student as unknown as Record<string, unknown>).phone as string ?? null,
      grade: student.grade,
      enrollmentNumber: (student as unknown as Record<string, unknown>).enrollmentNumber as string ?? null,
      dateOfBirth: (student as unknown as Record<string, unknown>).dateOfBirth as string ?? null,
      school: school?.name ?? null,
      schoolId: student.schoolId,
      averageGrade: Number(average.toFixed(2)),
      absences,
    };
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("students")
    .select("*, schools:schoolId(name)")
    .eq("userId", userId)
    .limit(1);
  if (!data || data.length === 0) return null;
  const row = data[0] as Record<string, unknown>;
  const student = row as Student;
  const schoolData = row.schools as Record<string, unknown>;
  const { data: scoreRows } = await supabase
    .from("assessmentScores")
    .select("score")
    .eq("studentId", student.id);
  const scores = scoreRows ?? [];
  const average =
    scores.length > 0
      ? scores.reduce(
          (acc: number, r: Record<string, unknown>) => acc + Number(r.score),
          0
        ) / scores.length
      : 0;
  const { count: absentCount } = await supabase
    .from("attendanceRecords")
    .select("*", { count: "exact", head: true })
    .eq("studentId", student.id)
    .eq("status", "absent");
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    phone: (row.phone as string) ?? null,
    grade: student.grade,
    enrollmentNumber: (row.enrollmentNumber as string) ?? null,
    dateOfBirth: (row.dateOfBirth as string) ?? null,
    school: (schoolData?.name as string) ?? null,
    schoolId: student.schoolId,
    averageGrade: Number(average.toFixed(2)),
    absences: absentCount ?? 0,
  };
}

export async function getStudentGrades(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return [];
    return memory.assessmentScores
      .filter(s => s.studentId === student.id)
      .map(s => {
        const a = memory.assessments.find(a2 => a2.id === s.assessmentId)!;
        const cs = memory.classSubjects.find(c => c.id === a.classSubjectId)!;
        const subj = memory.subjects.find(s2 => s2.id === cs.subjectId)!;
        return {
          subject: subj.name,
          grade: Number(s.score),
          date: a.assessmentDate,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_student_grades", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(row => {
    const camel = row as Record<string, unknown>;
    return {
      ...camel,
      grade: Number((camel as Record<string, unknown>).grade),
    };
  });
}

export async function getStudentCommunications(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return [];
    const directIds = memory.communicationRecipients
      .filter(
        r => r.recipientType === "student" && r.recipientRefId === student.id
      )
      .map(r => r.communicationId);
    const schoolComms = memory.communications
      .filter(c => c.schoolId === student.schoolId)
      .map(c => c.id);
    const ids = Array.from(new Set([...directIds, ...schoolComms]));
    return memory.communications
      .filter(c => ids.includes(c.id))
      .map(c => ({
        id: c.id,
        title: c.title,
        body: c.body,
        type: c.communicationType,
        createdAt: c.createdAt,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_student_communications", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(row => {
    const camel = row as Record<string, unknown>;
    return { ...camel, type: (camel as Record<string, unknown>).type };
  });
}

export async function getGuardianProfile(userId: number) {
  if (useMemoryStore()) {
    const guardian = memory.guardians.find(g => g.userId === userId);
    if (!guardian) return null;
    return {
      id: guardian.id,
      name: guardian.name,
      email: guardian.email,
      relationship: guardian.relationship,
      schoolId: guardian.schoolId,
      students: await getGuardianStudents(userId),
    };
  }
  const result = await supaSelectOne<Guardian>("guardians", { userId });
  if (!result) return null;
  return {
    id: result.id,
    name: result.name,
    email: result.email,
    relationship: result.relationship,
    schoolId: result.schoolId,
    students: await getGuardianStudents(userId),
  };
}

export async function getGuardianStudents(userId: number) {
  if (useMemoryStore()) {
    const guardian = memory.guardians.find(g => g.userId === userId);
    if (!guardian) return [];
    return memory.studentGuardians
      .filter(sg => sg.guardianId === guardian.id)
      .map(link => {
        const student = memory.students.find(s => s.id === link.studentId);
        if (!student) return null;
        const scores = memory.assessmentScores.filter(
          s => s.studentId === student.id
        );
        const avg =
          scores.length > 0
            ? scores.reduce((a, i) => a + Number(i.score), 0) / scores.length
            : 0;
        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          enrollmentNumber: student.enrollmentNumber ?? null,
          averageGrade: Number(avg.toFixed(2)),
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      name: string;
      grade: string | null;
      enrollmentNumber: string | null;
      averageGrade: number;
    }>;
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_guardian_students", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(row => ({
    id: row.id as number,
    name: row.name as string,
    grade: (row.grade ?? null) as string | null,
    enrollmentNumber: ((row.enrollmentNumber ?? row.enrollmentnumber) ?? null) as string | null,
    averageGrade: Number(row.averageGrade ?? row.averagegrade ?? 0),
  }));
}

export async function getGuardianStudentPerformance(
  userId: number,
  studentId: number
) {
  if (useMemoryStore()) {
    const guardian = memory.guardians.find(g => g.userId === userId);
    if (!guardian) return null;
    if (
      !memory.studentGuardians.some(
        sg => sg.guardianId === guardian.id && sg.studentId === studentId
      )
    )
      return null;
    const grades = await getStudentGradesForStudentId(studentId);
    const absences = memory.attendanceRecords.filter(
      ar => ar.studentId === studentId && ar.status === "absent"
    ).length;
    const alerts = memory.studentComments
      .filter(
        c =>
          c.studentId === studentId &&
          (c.category === "ocorrencia" || c.category === "melhoria")
      )
      .map(c => {
        const tName = memory.teachers.find(t => t.id === c.teacherId)?.name;
        return tName
          ? `${c.category.toUpperCase()}: ${c.content} (${tName})`
          : `${c.category.toUpperCase()}: ${c.content}`;
      });
    return { studentId, grades, absences, alerts };
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(
    "get_guardian_student_performance",
    { p_user_id: userId, p_student_id: studentId }
  );
  if (error || !data) return null;
  const result = data as Record<string, unknown>;
  return result as unknown as {
    studentId: number;
    grades: Array<{ subject: string; grade: number; date: string }>;
    absences: number;
    alerts: string[];
  };
}

async function getStudentGradesForStudentId(studentId: number) {
  if (useMemoryStore()) {
    return memory.assessmentScores
      .filter(s => s.studentId === studentId)
      .map(s => {
        const a = memory.assessments.find(a2 => a2.id === s.assessmentId)!;
        const cs = memory.classSubjects.find(c => c.id === a.classSubjectId)!;
        const subj = memory.subjects.find(s2 => s2.id === cs.subjectId)!;
        return {
          subject: subj.name,
          grade: Number(s.score),
          date: a.assessmentDate,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("assessmentScores")
    .select(
      "score, assessments:assessmentId(assessmentDate, classSubjects:classSubjectId(subjects:subjectId(name)))"
    )
    .eq("studentId", studentId)
    .order("assessmentDate", {
      referencedTable: "assessments",
      ascending: false,
    });
  if (!data) return [];
  return (data as Record<string, unknown>[]).map(row => {
    const r = row as Record<string, unknown>;
    const a = r.assessments as Record<string, unknown>;
    const cs = a?.classSubjects as Record<string, unknown>;
    const subj = cs?.subjects as Record<string, unknown>;
    return {
      subject: (subj?.name as string) ?? "",
      grade: Number(r.score),
      date: (a?.assessmentDate as string) ?? "",
    };
  });
}

// ── Registry CRUD (generic) ────────────────────────────────────

type RegistryFilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | Array<string | number | boolean>;
type RegistryFilters = Record<string, RegistryFilterValue | undefined>;
type RegistryListParams = {
  limit?: number;
  offset?: number;
  filters?: RegistryFilters;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  includeDeleted?: boolean;
};

export async function listEntityRows<E extends RegistryEntityName>(
  entity: E,
  params: RegistryListParams = {}
): Promise<RegistryEntityRowMap[E][]> {
  const limit = clampRegistryLimit(params.limit);
  const offset = Math.max(0, params.offset ?? 0);
  const orderDirection = params.orderDirection ?? "desc";

  if (useMemoryStore()) {
    let rows = getMemoryStoreByEntity(entity)
      .filter(row => rowMatchesFilters(row, params.filters))
      .slice();
    if (!params.includeDeleted && entitySupportsSoftDelete(entity))
      rows = rows.filter(row => !(row as Record<string, unknown>).deletedAt);
    const orderBy =
      params.orderBy && hasColumn(entity, params.orderBy)
        ? params.orderBy
        : hasColumn(entity, "createdAt")
          ? "createdAt"
          : "id";
    rows.sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal instanceof Date && bVal instanceof Date)
        return orderDirection === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      return orderDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return rows.slice(offset, offset + limit) as RegistryEntityRowMap[E][];
  }

  const supabase = getSupabase();
  if (!supabase) return [];
  const table = entityTableName[entity];
  const filters = params.filters ?? {};

  let query = supabase.from(table).select("*");

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) {
      query = query.is(key, null);
      continue;
    }
    if (value === "not_null") {
      query = query.not(key, "is", null);
      continue;
    }
    if (Array.isArray(value)) {
      query = query.in(key, value as Array<string | number | boolean>);
      continue;
    }
    query = query.eq(key, value as string | number | boolean);
  }

  if (!params.includeDeleted && entitySupportsSoftDelete(entity)) {
    query = query.is("deletedAt", null);
  }

  const orderByCol =
    params.orderBy && hasColumn(entity, params.orderBy)
      ? params.orderBy
      : hasColumn(entity, "createdAt")
        ? "createdAt"
        : "id";
  const finalOrderCol = hasColumn(entity, orderByCol) ? orderByCol : "id";

  query = query.order(finalOrderCol, { ascending: orderDirection === "asc" });
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as RegistryEntityRowMap[E][];
}

export async function getEntityById<E extends RegistryEntityName>(
  entity: E,
  id: number
): Promise<RegistryEntityRowMap[E] | null> {
  if (useMemoryStore())
    return (
      (getMemoryStoreByEntity(entity).find(row => toInt(row.id) === id) as
        | RegistryEntityRowMap[E]
        | undefined) ?? null
    );
  const table = entityTableName[entity];
  return await supaSelectOne<RegistryEntityRowMap[E]>(table, { id });
}

export async function createEntityRow<E extends RegistryEntityName>(
  entity: E,
  payload: Record<string, unknown>
): Promise<RegistryEntityRowMap[E] | null> {
  const data = sanitizeEntityPayload(entity, payload, { isUpdate: false });
  if (Object.keys(data).length === 0)
    throw new Error("No valid fields to create entity");
  if (useMemoryStore()) {
    const target = getMemoryStoreByEntity(entity);
    const row: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (entityColumns[entity]?.has(key)) row[key] = value;
    }
    applyMemoryEntityDefaults(entity, row);
    if (hasColumn(entity, "id") && (row.id === undefined || row.id === null))
      row.id = (memoryIds as Record<string, number>)[entity]++;
    if (hasColumn(entity, "createdAt") && row.createdAt === undefined)
      row.createdAt = new Date();
    if (hasColumn(entity, "updatedAt") && row.updatedAt === undefined)
      row.updatedAt = new Date();
    target.push(row);
    return row as RegistryEntityRowMap[E];
  }
  const table = entityTableName[entity];
  const supabase = getSupabase();
  if (!supabase) return null;
  const now = new Date().toISOString();
  if (entityColumns[entity]?.has("updatedAt") && !data.updatedAt)
    data.updatedAt = now;
  const { data: created, error } = await supabase
    .from(table)
    .insert(data)
    .select();
  if (error || !created || created.length === 0) return null;
  return created[0] as unknown as RegistryEntityRowMap[E];
}

export async function updateEntityRow<E extends RegistryEntityName>(
  entity: E,
  id: number,
  payload: Record<string, unknown>
): Promise<RegistryEntityRowMap[E] | null> {
  const data = sanitizeEntityPayload(entity, payload, { isUpdate: true });
  if (Object.keys(data).length === 0) return await getEntityById(entity, id);
  if (useMemoryStore()) {
    const target = getMemoryStoreByEntity(entity);
    const index = target.findIndex(row => toInt(row.id) === id);
    if (index < 0) return null;
    const next = {
      ...target[index],
      ...payload,
      ...(hasColumn(entity, "updatedAt") ? { updatedAt: new Date() } : {}),
    };
    target[index] = next;
    return next as RegistryEntityRowMap[E];
  }
  const table = entityTableName[entity];
  const supabase = getSupabase();
  if (!supabase) return null;
  if (entityColumns[entity]?.has("updatedAt") && !data.updatedAt)
    data.updatedAt = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from(table)
    .update(data)
    .eq("id", id)
    .select();
  if (error || !updated || updated.length === 0) return null;
  return updated[0] as unknown as RegistryEntityRowMap[E];
}

const SOFT_DELETE_ENTITIES: Set<RegistryEntityName> = new Set([
  "students",
  "teachers",
  "guardians",
  "classes",
  "classEnrollments",
  "attendanceRecords",
  "assessments",
  "assessmentScores",
  "studentComments",
  "schoolEvents",
  "communications",
  "notifications",
]);

export function entitySupportsSoftDelete(entity: RegistryEntityName): boolean {
  return SOFT_DELETE_ENTITIES.has(entity);
}

export async function deleteEntityRow<E extends RegistryEntityName>(
  entity: E,
  id: number,
  permanent: boolean = false
): Promise<RegistryEntityRowMap[E] | null> {
  if (!permanent && entitySupportsSoftDelete(entity))
    return await updateEntityRow(entity, id, {
      deletedAt: new Date().toISOString(),
    });
  if (useMemoryStore()) {
    const target = getMemoryStoreByEntity(entity);
    const index = target.findIndex(row => toInt(row.id) === id);
    if (index < 0) return null;
    const [removed] = target.splice(index, 1);
    return (removed as RegistryEntityRowMap[E] | undefined) ?? null;
  }
  const table = entityTableName[entity];
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: deleted, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select();
  if (error || !deleted || deleted.length === 0) return null;
  return deleted[0] as unknown as RegistryEntityRowMap[E];
}

export async function restoreEntityRow<E extends RegistryEntityName>(
  entity: E,
  id: number
): Promise<RegistryEntityRowMap[E] | null> {
  if (!entitySupportsSoftDelete(entity))
    throw new Error(`Entity ${entity} does not support soft-delete/restore`);
  return await updateEntityRow(entity, id, { deletedAt: null });
}

export async function listDeletedEntityRows<E extends RegistryEntityName>(
  entity: E,
  params: Omit<RegistryListParams, "includeDeleted"> = {}
): Promise<RegistryEntityRowMap[E][]> {
  return await listEntityRows(entity, {
    ...params,
    includeDeleted: true,
    filters: { ...(params.filters ?? {}), deletedAt: "not_null" as any },
  });
}

export async function getUserManagedSchoolIds(
  userId: number
): Promise<number[]> {
  if (useMemoryStore()) {
    const fromUserSchools = memory.userSchools
      .filter(link => link.userId === userId)
      .map(link => link.schoolId);
    if (fromUserSchools.length > 0)
      return Array.from(new Set(fromUserSchools));
    // Fallback: derive school from guardian or student profile
    const guardianSchoolId = memory.guardians.find(g => g.userId === userId)?.schoolId;
    if (guardianSchoolId) return [guardianSchoolId];
    const studentSchoolId = memory.students.find(s => s.userId === userId)?.schoolId;
    if (studentSchoolId) return [studentSchoolId];
    return [];
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("userSchools")
    .select("schoolId")
    .eq("userId", userId);
  if (data && data.length > 0)
    return Array.from(new Set(data.map(row => row.schoolId)));
  // Fallback: derive school from guardian or student profile
  const { data: guardian } = await supabase
    .from("guardians")
    .select("schoolId")
    .eq("userId", userId)
    .limit(1)
    .single();
  if (guardian?.schoolId) return [guardian.schoolId];
  const { data: student } = await supabase
    .from("students")
    .select("schoolId")
    .eq("userId", userId)
    .limit(1)
    .single();
  if (student?.schoolId) return [student.schoolId];
  return [];
}

export async function userHasSchoolAccess(
  userId: number,
  schoolId: number
): Promise<boolean> {
  const schoolIds = await getUserManagedSchoolIds(userId);
  return schoolIds.includes(schoolId);
}

export async function resolveEntitySchoolId(
  entity: RegistryEntityName,
  row: Record<string, unknown> | null
): Promise<number | null> {
  if (!row) return null;
  switch (entity) {
    case "schools":
      return toInt(row.id);
    case "schoolYears":
    case "userSchools":
    case "schoolStaffProfiles":
    case "teachers":
    case "students":
    case "guardians":
    case "subjects":
    case "classes":
    case "studentComments":
    case "schoolEvents":
    case "communications":
    case "contacts":
      return toInt(row.schoolId);
    case "studentGuardians": {
      const studentId = toInt(row.studentId);
      if (!studentId) return null;
      const student = (await getEntityById("students", studentId)) as Record<
        string,
        unknown
      > | null;
      return toInt(student?.schoolId);
    }
    case "classSubjects": {
      const classId = toInt(row.classId);
      if (!classId) return null;
      const classRow = (await getEntityById("classes", classId)) as Record<
        string,
        unknown
      > | null;
      return toInt(classRow?.schoolId);
    }
    case "classTeachers": {
      const csId = toInt(row.classSubjectId);
      if (!csId) return null;
      const cs = (await getEntityById("classSubjects", csId)) as Record<
        string,
        unknown
      > | null;
      return await resolveEntitySchoolId("classSubjects", cs);
    }
    case "classEnrollments": {
      const classId = toInt(row.classId);
      if (!classId) return null;
      const classRow = (await getEntityById("classes", classId)) as Record<
        string,
        unknown
      > | null;
      return toInt(classRow?.schoolId);
    }
    case "classSessions": {
      const csId = toInt(row.classSubjectId);
      if (!csId) return null;
      const cs = (await getEntityById("classSubjects", csId)) as Record<
        string,
        unknown
      > | null;
      return await resolveEntitySchoolId("classSubjects", cs);
    }
    case "attendanceRecords": {
      const sessionId = toInt(row.classSessionId);
      if (!sessionId) return null;
      const session = (await getEntityById(
        "classSessions",
        sessionId
      )) as Record<string, unknown> | null;
      return await resolveEntitySchoolId("classSessions", session);
    }
    case "assessments": {
      const csId = toInt(row.classSubjectId);
      if (!csId) return null;
      const cs = (await getEntityById("classSubjects", csId)) as Record<
        string,
        unknown
      > | null;
      return await resolveEntitySchoolId("classSubjects", cs);
    }
    case "assessmentScores": {
      const aId = toInt(row.assessmentId);
      if (!aId) return null;
      const a = (await getEntityById("assessments", aId)) as Record<
        string,
        unknown
      > | null;
      return await resolveEntitySchoolId("assessments", a);
    }
    case "eventTargets": {
      const eId = toInt(row.eventId);
      if (!eId) return null;
      const e = (await getEntityById("schoolEvents", eId)) as Record<
        string,
        unknown
      > | null;
      return toInt(e?.schoolId);
    }
    case "communicationRecipients": {
      const cId = toInt(row.communicationId);
      if (!cId) return null;
      const c = (await getEntityById("communications", cId)) as Record<
        string,
        unknown
      > | null;
      return toInt(c?.schoolId);
    }
    case "attachments": {
      const ownerType = row.ownerType;
      const ownerId = toInt(row.ownerId);
      if (!ownerId || typeof ownerType !== "string") return null;
      if (ownerType === "event") {
        const e = (await getEntityById("schoolEvents", ownerId)) as Record<
          string,
          unknown
        > | null;
        return toInt(e?.schoolId);
      }
      if (ownerType === "communication") {
        const c = (await getEntityById("communications", ownerId)) as Record<
          string,
          unknown
        > | null;
        return toInt(c?.schoolId);
      }
      if (ownerType === "comment") {
        const c = (await getEntityById("studentComments", ownerId)) as Record<
          string,
          unknown
        > | null;
        return toInt(c?.schoolId);
      }
      return null;
    }
    case "notifications": {
      const uId = toInt(row.userId);
      if (!uId) return null;
      const schoolIds = await getUserManagedSchoolIds(uId);
      return schoolIds[0] ?? null;
    }
    case "users":
      return null;
    case "absenceJustifications":
    case "auditLogs":
    case "schoolPlatforms":
    case "scheduleSlots":
      return toInt(row.schoolId);
    case "tasks":
    case "taskSubmissions":
      return null;
    default: {
      const exhaustive: never = entity;
      throw new Error(
        `Unsupported entity in school resolver: ${String(exhaustive)}`
      );
    }
  }
}

// Batch-resolves schoolId for a list of rows of the same entity type.
// Replaces the per-row resolveEntitySchoolId loop to eliminate N+1 queries.
export async function batchResolveSchoolIds(
  entity: RegistryEntityName,
  rows: Array<Record<string, unknown>>
): Promise<Array<number | null>> {
  if (rows.length === 0) return [];

  // Memory store is fast enough without batching
  if (useMemoryStore()) {
    return Promise.all(rows.map(row => resolveEntitySchoolId(entity, row)));
  }

  const uniqueIntField = (field: string): number[] =>
    Array.from(new Set(rows.map(r => toInt(r[field])).filter((id): id is number => id !== null)));

  if (entity === "schools") return rows.map(row => toInt(row.id));

  const directEntities = new Set<RegistryEntityName>([
    "schoolYears", "userSchools", "schoolStaffProfiles", "teachers",
    "students", "guardians", "subjects", "classes", "studentComments",
    "schoolEvents", "communications", "contacts", "absenceJustifications",
    "auditLogs", "schoolPlatforms", "scheduleSlots",
  ]);
  if (directEntities.has(entity)) return rows.map(row => toInt(row.schoolId));

  if (entity === "users" || entity === "notifications") {
    return Promise.all(rows.map(row => resolveEntitySchoolId(entity, row)));
  }

  if (entity === "classSubjects" || entity === "classEnrollments") {
    const classIds = uniqueIntField("classId");
    const classes = classIds.length > 0
      ? await listEntityRows("classes", { filters: { id: classIds }, limit: classIds.length })
      : [];
    const schoolByClassId = new Map(classes.map(c => [c.id, c.schoolId]));
    return rows.map(row => schoolByClassId.get(toInt(row.classId)!) ?? null);
  }

  if (entity === "classTeachers" || entity === "classSessions" || entity === "assessments") {
    const csIds = uniqueIntField("classSubjectId");
    const classSubjects = csIds.length > 0
      ? await listEntityRows("classSubjects", { filters: { id: csIds }, limit: csIds.length })
      : [];
    const classIds = Array.from(new Set(classSubjects.map(cs => cs.classId)));
    const classes = classIds.length > 0
      ? await listEntityRows("classes", { filters: { id: classIds }, limit: classIds.length })
      : [];
    const schoolByClassId = new Map(classes.map(c => [c.id, c.schoolId]));
    const classIdByCsId = new Map(classSubjects.map(cs => [cs.id, cs.classId]));
    return rows.map(row => {
      const csId = toInt(row.classSubjectId);
      const classId = csId ? classIdByCsId.get(csId) : null;
      return classId ? schoolByClassId.get(classId) ?? null : null;
    });
  }

  if (entity === "attendanceRecords") {
    const sessionIds = uniqueIntField("classSessionId");
    const sessions = sessionIds.length > 0
      ? await listEntityRows("classSessions", { filters: { id: sessionIds }, limit: sessionIds.length })
      : [];
    const csIds = Array.from(new Set(sessions.map(s => s.classSubjectId)));
    const classSubjects = csIds.length > 0
      ? await listEntityRows("classSubjects", { filters: { id: csIds }, limit: csIds.length })
      : [];
    const classIds = Array.from(new Set(classSubjects.map(cs => cs.classId)));
    const classes = classIds.length > 0
      ? await listEntityRows("classes", { filters: { id: classIds }, limit: classIds.length })
      : [];
    const schoolByClassId = new Map(classes.map(c => [c.id, c.schoolId]));
    const classIdByCsId = new Map(classSubjects.map(cs => [cs.id, cs.classId]));
    const csIdBySessionId = new Map(sessions.map(s => [s.id, s.classSubjectId]));
    return rows.map(row => {
      const sessionId = toInt(row.classSessionId);
      const csId = sessionId ? csIdBySessionId.get(sessionId) : null;
      const classId = csId ? classIdByCsId.get(csId) : null;
      return classId ? schoolByClassId.get(classId) ?? null : null;
    });
  }

  if (entity === "assessmentScores") {
    const assessmentIds = uniqueIntField("assessmentId");
    const assessments = assessmentIds.length > 0
      ? await listEntityRows("assessments", { filters: { id: assessmentIds }, limit: assessmentIds.length })
      : [];
    const csIds = Array.from(new Set(assessments.map(a => a.classSubjectId)));
    const classSubjects = csIds.length > 0
      ? await listEntityRows("classSubjects", { filters: { id: csIds }, limit: csIds.length })
      : [];
    const classIds = Array.from(new Set(classSubjects.map(cs => cs.classId)));
    const classes = classIds.length > 0
      ? await listEntityRows("classes", { filters: { id: classIds }, limit: classIds.length })
      : [];
    const schoolByClassId = new Map(classes.map(c => [c.id, c.schoolId]));
    const classIdByCsId = new Map(classSubjects.map(cs => [cs.id, cs.classId]));
    const csIdByAssessmentId = new Map(assessments.map(a => [a.id, a.classSubjectId]));
    return rows.map(row => {
      const aId = toInt(row.assessmentId);
      const csId = aId ? csIdByAssessmentId.get(aId) : null;
      const classId = csId ? classIdByCsId.get(csId) : null;
      return classId ? schoolByClassId.get(classId) ?? null : null;
    });
  }

  if (entity === "studentGuardians") {
    const studentIds = uniqueIntField("studentId");
    const students = studentIds.length > 0
      ? await listEntityRows("students", { filters: { id: studentIds }, limit: studentIds.length })
      : [];
    const schoolByStudentId = new Map(students.map(s => [s.id, s.schoolId]));
    return rows.map(row => schoolByStudentId.get(toInt(row.studentId)!) ?? null);
  }

  if (entity === "eventTargets") {
    const eventIds = uniqueIntField("eventId");
    const events = eventIds.length > 0
      ? await listEntityRows("schoolEvents", { filters: { id: eventIds }, limit: eventIds.length })
      : [];
    const schoolByEventId = new Map(events.map(e => [e.id, e.schoolId]));
    return rows.map(row => schoolByEventId.get(toInt(row.eventId)!) ?? null);
  }

  if (entity === "communicationRecipients") {
    const commIds = uniqueIntField("communicationId");
    const comms = commIds.length > 0
      ? await listEntityRows("communications", { filters: { id: commIds }, limit: commIds.length })
      : [];
    const schoolByCommId = new Map(comms.map(c => [c.id, c.schoolId]));
    return rows.map(row => schoolByCommId.get(toInt(row.communicationId)!) ?? null);
  }

  if (entity === "attachments") {
    const eventOwnerIds = Array.from(new Set(
      rows.filter(r => r.ownerType === "event").map(r => toInt(r.ownerId)).filter((id): id is number => id !== null)
    ));
    const commOwnerIds = Array.from(new Set(
      rows.filter(r => r.ownerType === "communication").map(r => toInt(r.ownerId)).filter((id): id is number => id !== null)
    ));
    const commentOwnerIds = Array.from(new Set(
      rows.filter(r => r.ownerType === "comment").map(r => toInt(r.ownerId)).filter((id): id is number => id !== null)
    ));
    const [events, comms, comments] = await Promise.all([
      eventOwnerIds.length > 0 ? listEntityRows("schoolEvents", { filters: { id: eventOwnerIds }, limit: eventOwnerIds.length }) : [],
      commOwnerIds.length > 0 ? listEntityRows("communications", { filters: { id: commOwnerIds }, limit: commOwnerIds.length }) : [],
      commentOwnerIds.length > 0 ? listEntityRows("studentComments", { filters: { id: commentOwnerIds }, limit: commentOwnerIds.length }) : [],
    ]);
    const eventSchool = new Map(events.map(e => [e.id, e.schoolId]));
    const commSchool = new Map(comms.map(c => [c.id, c.schoolId]));
    const commentSchool = new Map(comments.map(c => [c.id, c.schoolId]));
    return rows.map(row => {
      const ownerId = toInt(row.ownerId);
      if (!ownerId) return null;
      if (row.ownerType === "event") return eventSchool.get(ownerId) ?? null;
      if (row.ownerType === "communication") return commSchool.get(ownerId) ?? null;
      if (row.ownerType === "comment") return commentSchool.get(ownerId) ?? null;
      return null;
    });
  }

  return Promise.all(rows.map(row => resolveEntitySchoolId(entity, row)));
}

export async function validateAttachmentOwner(
  ownerType: "event" | "communication" | "comment",
  ownerId: number
) {
  if (ownerType === "event")
    return Boolean(await getEntityById("schoolEvents", ownerId));
  if (ownerType === "communication")
    return Boolean(await getEntityById("communications", ownerId));
  return Boolean(await getEntityById("studentComments", ownerId));
}

export async function createNotification(
  notification: Omit<Notification, "id" | "createdAt" | "updatedAt" | "isRead" | "readAt" | "deletedAt"> & {
    readAt?: Date | null;
    deletedAt?: Date | null;
  }
): Promise<Notification> {
  return (await createEntityRow("notifications", {
    ...notification,
    isRead: 0,
    readAt: notification.readAt ?? null,
    deletedAt: notification.deletedAt ?? null,
  })) as Notification;
}

export async function createCommunication(input: {
  schoolId: number;
  authorId: number | null;
  title: string;
  body: string;
  communicationType?: string;
  publishedAt?: string;
  relatedEventId?: number | null;
}) {
  if (useMemoryStore()) {
    const existing = memory.communications.find(
      c =>
        c.schoolId === input.schoolId &&
        c.title === input.title &&
        c.body === input.body
    );
    if (existing) return existing;
    const created: Communication = {
      id: memoryIds.communications++,
      schoolId: input.schoolId,
      authorUserId: input.authorId ?? null,
      title: input.title,
      body: input.body,
      communicationType: input.communicationType ?? "announcement",
      relatedEventId: input.relatedEventId ?? null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.communications.push(created);
    return created;
  }
  return await supaInsert<Communication>("communications", {
    schoolId: input.schoolId,
    authorUserId: input.authorId ?? null,
    title: input.title,
    body: input.body,
    communicationType: input.communicationType ?? "announcement",
    relatedEventId: input.relatedEventId ?? null,
  });
}

export async function createSchoolEvent(input: {
  schoolId: number;
  authorId: number | null;
  title: string;
  description?: string | null;
  eventType?: string;
  eventDate: string;
}) {
  if (useMemoryStore()) {
    const existing = memory.schoolEvents.find(
      e =>
        e.schoolId === input.schoolId &&
        e.title === input.title &&
        e.startsAt === input.eventDate
    );
    if (existing) return existing;
    const created: SchoolEvent = {
      id: memoryIds.schoolEvents++,
      schoolId: input.schoolId,
      title: input.title,
      description: input.description ?? null,
      eventType: input.eventType ?? "evento_escolar",
      startsAt: input.eventDate,
      endsAt: null,
      createdByUserId: input.authorId ?? null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.schoolEvents.push(created);
    return created;
  }
  return await supaInsert<SchoolEvent>("schoolEvents", {
    schoolId: input.schoolId,
    createdByUserId: input.authorId ?? null,
    title: input.title,
    description: input.description ?? null,
    eventType: input.eventType ?? "evento_escolar",
    startsAt: input.eventDate,
  });
}

export async function listNotificationsForUser(
  userId: number,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
) {
  const filters: RegistryFilters = { userId };
  if (options.unreadOnly) filters.isRead = 0;
  return await listEntityRows("notifications", {
    filters,
    limit: options.limit,
    offset: options.offset,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
}

export async function markNotificationAsReadForUser(
  notificationId: number,
  userId: number
) {
  const current = await getEntityById("notifications", notificationId);
  if (!current || toInt(current.userId) !== userId) return null;
  return await updateEntityRow("notifications", notificationId, {
    isRead: 1,
    readAt: new Date(),
  });
}

export async function markAllNotificationsAsReadForUser(userId: number) {
  const notificationsForUser = await listNotificationsForUser(userId, {
    unreadOnly: true,
    limit: 500,
  });
  let updated = 0;
  for (const notification of notificationsForUser) {
    const id = toInt(notification.id);
    if (!id) continue;
    await updateEntityRow("notifications", id, {
      isRead: 1,
      readAt: new Date(),
    });
    updated += 1;
  }
  return { updated };
}

export async function getClassSessionById(id: number) {
  if (useMemoryStore())
    return memory.classSessions.find(s => s.id === id) ?? null;
  return await supaSelectOne<ClassSession>("classSessions", { id });
}

export async function isStudentEnrolledInClass(
  studentId: number,
  classId: number
) {
  if (useMemoryStore())
    return memory.classEnrollments.some(
      e =>
        e.studentId === studentId &&
        e.classId === classId &&
        e.status === "ativo"
    );
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("classEnrollments")
    .select("id")
    .eq("studentId", studentId)
    .eq("classId", classId)
    .eq("status", "ativo")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function isTeacherOfClassSubject(
  teacherId: number,
  classSubjectId: number
) {
  if (useMemoryStore())
    return memory.classTeachers.some(
      ct => ct.teacherId === teacherId && ct.classSubjectId === classSubjectId
    );
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("classTeachers")
    .select("id")
    .eq("teacherId", teacherId)
    .eq("classSubjectId", classSubjectId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function attendanceRecordExists(
  classSessionId: number,
  studentId: number
) {
  if (useMemoryStore())
    return memory.attendanceRecords.some(
      r => r.classSessionId === classSessionId && r.studentId === studentId
    );
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("attendanceRecords")
    .select("id")
    .eq("classSessionId", classSessionId)
    .eq("studentId", studentId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function getAssessmentById(id: number) {
  if (useMemoryStore())
    return memory.assessments.find(a => a.id === id) ?? null;
  return await supaSelectOne<Assessment>("assessments", { id });
}

export async function getClassSubjectById(id: number) {
  if (useMemoryStore())
    return memory.classSubjects.find(cs => cs.id === id) ?? null;
  return await supaSelectOne<ClassSubject>("classSubjects", { id });
}

export async function getCommentsByTeacher(teacherId: number) {
  if (useMemoryStore()) {
    return memory.studentComments
      .filter(c => c.teacherId === teacherId)
      .map(c => {
        const student = memory.students.find(s => s.id === c.studentId);
        const teacher = memory.teachers.find(t => t.id === c.teacherId);
        return {
          id: c.id,
          category: c.category,
          content: c.content,
          createdAt: c.createdAt,
          author: teacher?.name ?? null,
          studentName: student?.name ?? null,
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_comments_by_teacher", {
    p_teacher_id: teacherId,
  });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(
    row =>
      row as unknown as {
        id: number;
        category: string;
        content: string;
        createdAt: Date;
        author: string | null;
        studentName: string | null;
      }
  );
}

export async function getStudentAttendanceStats(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student)
      return {
        total: 0,
        presents: 0,
        absents: 0,
        justified: 0,
        pct: 100,
        bySubject: [],
      };
    const records = memory.attendanceRecords.filter(
      r => r.studentId === student.id
    );
    const presents = records.filter(r => r.status === "present").length;
    const absents = records.filter(r => r.status === "absent").length;
    const justified = records.filter(r => r.status === "justified").length;
    const total = records.length;
    const pct = total > 0 ? Math.round((presents / total) * 100) : 100;
    const bySubjectMap = new Map<
      number,
      { subjectId: number; subject: string; classes: number; absences: number }
    >();
    for (const r of records) {
      const session = memory.classSessions.find(s => s.id === r.classSessionId);
      if (!session) continue;
      const cs = memory.classSubjects.find(
        c => c.id === session.classSubjectId
      );
      if (!cs) continue;
      const sub = memory.subjects.find(s => s.id === cs.subjectId);
      const subjectId = cs.subjectId;
      let entry = bySubjectMap.get(subjectId);
      if (!entry) {
        entry = {
          subjectId,
          subject: sub?.name ?? "—",
          classes: 0,
          absences: 0,
        };
        bySubjectMap.set(subjectId, entry);
      }
      entry.classes++;
      if (r.status === "absent") entry.absences++;
    }
    const bySubject = Array.from(bySubjectMap.values()).map(e => ({
      ...e,
      pct:
        e.classes > 0
          ? Math.round(((e.classes - e.absences) / e.classes) * 100)
          : 100,
    }));
    return { total, presents, absents, justified, pct, bySubject };
  }
  const supabase = getSupabase();
  if (!supabase)
    return {
      total: 0,
      presents: 0,
      absents: 0,
      justified: 0,
      pct: 100,
      bySubject: [],
    };
  const { data, error } = await supabase.rpc("get_student_attendance_stats", {
    p_user_id: userId,
  });
  if (error || !data)
    return {
      total: 0,
      presents: 0,
      absents: 0,
      justified: 0,
      pct: 100,
      bySubject: [],
    };
  const result = data as Record<string, unknown>;
  return result as unknown as {
    total: number;
    presents: number;
    absents: number;
    justified: number;
    pct: number;
    bySubject: Array<{
      subjectId: number;
      subject: string;
      classes: number;
      absences: number;
      pct: number;
    }>;
  };
}

export async function getStudentClassInfo(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return null;
    const enrollment = memory.classEnrollments.find(
      e => e.studentId === student.id && e.status === "ativo"
    );
    if (!enrollment) return null;
    const cls = memory.classes.find(c => c.id === enrollment.classId);
    if (!cls) return null;
    const sy = memory.schoolYears.find(y => y.id === cls.schoolYearId);
    return {
      classId: cls.id,
      className: cls.name,
      classCode: cls.code ?? cls.name,
      schoolYear: sy?.name ?? "",
      shift: cls.shift ?? null,
      course: cls.course ?? null,
    };
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_student_class_info", {
    p_user_id: userId,
  });
  if (error || !data || (data as Record<string, unknown>[]).length === 0)
    return null;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  const camel = row as Record<string, unknown>;
  return {
    ...camel,
    classCode:
      (camel as Record<string, unknown>).classCode ??
      (camel as Record<string, unknown>).className,
  };
}

export async function getStudentUpcomingEvents(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return [];
    const enrollment = memory.classEnrollments.find(
      e => e.studentId === student.id && e.status === "ativo"
    );
    const classId = enrollment?.classId;
    const now = new Date().toISOString().split("T")[0];
    return memory.schoolEvents
      .filter(e => {
        if (e.schoolId !== student.schoolId) return false;
        if (e.startsAt < now) return false;
        const target = memory.eventTargets.find(t => t.eventId === e.id);
        if (!target) return true;
        if (target.targetType === "school") return true;
        if (target.targetType === "class" && target.targetRefId === classId)
          return true;
        return false;
      })
      .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1))
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        title: e.title,
        eventType: e.eventType,
        eventDate: e.startsAt,
        description: e.description,
      }));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_student_upcoming_events", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(
    row =>
      row as unknown as {
        id: number;
        title: string;
        eventType: string;
        eventDate: string;
        description: string | null;
      }
  );
}

export async function getStudentNextExam(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return null;
    const enrollment = memory.classEnrollments.find(
      e => e.studentId === student.id && e.status === "ativo"
    );
    if (!enrollment) return null;
    const classSubjects = memory.classSubjects.filter(
      cs => cs.classId === enrollment.classId
    );
    const now = new Date().toISOString().split("T")[0];
    let earliest: { subject: string; date: string } | null = null;
    for (const cs of classSubjects) {
      const subject = memory.subjects.find(s => s.id === cs.subjectId);
      const assessments = memory.assessments
        .filter(a => a.classSubjectId === cs.id && a.assessmentDate >= now)
        .sort((a, b) => (a.assessmentDate < b.assessmentDate ? -1 : 1));
      if (
        assessments[0] &&
        (!earliest || assessments[0].assessmentDate < earliest.date)
      )
        earliest = {
          subject: subject?.name ?? "—",
          date: assessments[0].assessmentDate,
        };
    }
    return earliest;
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_student_next_exam", {
    p_user_id: userId,
  });
  if (error || !data) return null;
  const rows = data as Record<string, unknown>[];
  if (!rows || rows.length === 0) return null;
  return rows[0] as unknown as { subject: string; date: string };
}

export async function getSchoolPlatforms(schoolId: number) {
  if (useMemoryStore()) {
    return memory.schoolPlatforms
      .filter(p => p.schoolId === schoolId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        url: p.url,
        emoji: p.emoji,
        colorGradient: p.colorGradient,
      }));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("schoolPlatforms")
    .select("*")
    .eq("schoolId", schoolId)
    .order("sortOrder", { ascending: true });
  return data ? (data as Record<string, unknown>[] as SchoolPlatform[]) : [];
}

export async function getScheduleSlots(schoolId: number, shift: string) {
  if (useMemoryStore()) {
    return memory.scheduleSlots
      .filter(s => s.schoolId === schoolId && s.shift === shift)
      .sort((a, b) => a.slotNumber - b.slotNumber)
      .map(s => ({
        id: s.id,
        slotNumber: s.slotNumber,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("scheduleSlots")
    .select("*")
    .eq("schoolId", schoolId)
    .eq("shift", shift)
    .order("slotNumber", { ascending: true });
  return data ? (data as Record<string, unknown>[] as ScheduleSlot[]) : [];
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (useMemoryStore()) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("users").select("id").limit(1);
  return !error;
}

export async function listSchools(limit: number = 100) {
  if (useMemoryStore()) return memory.schools.slice(0, limit);
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("schools").select("*").limit(limit);
  return data ? (data as Record<string, unknown>[] as School[]) : [];
}
