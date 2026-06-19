export const MAX_REGISTRY_LIMIT = 500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RegistryRow = any;

export type RegistryUser = {
  id: number;
  openId?: string | null;
  name: string | null;
  email: string | null;
  loginMethod?: string | null;
  role?: string | null;
  defaultProfile?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastSignedIn?: string | null;
};

export type Student = {
  id: number;
  userId?: number | null;
  schoolId?: number | null;
  enrollmentNumber?: string | null;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  grade?: string | null;
  status?: string | null;
  avatarUrl?: string | null;
  className?: string | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Guardian = {
  id: number;
  userId?: number | null;
  schoolId?: number | null;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Teacher = {
  id: number;
  userId?: number | null;
  schoolId?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  active?: boolean | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Class = {
  id: number;
  schoolId?: number | null;
  schoolYearId?: number | null;
  name?: string | null;
  gradeLabel?: string | null;
  course?: string | null;
  code?: string | null;
  shift?: string | null;
  status?: string | null;
  studentCount?: number | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ClassSubject = {
  id: number;
  classId?: number | null;
  subjectId?: number | null;
  subjectName?: string | null;
  name?: string | null;
  createdAt?: string | null;
};

export type ClassEnrollment = {
  id: number;
  classId?: number | null;
  studentId?: number | null;
  enrollmentDate?: string | null;
  status?: string | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ClassSession = {
  id: number;
  classSubjectId?: number | null;
  teacherId?: number | null;
  lessonDate?: string | null;
  lessonNumber?: number | null;
  topic?: string | null;
  notes?: string | null;
  subjectName?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export type AttendanceRecord = {
  id: number;
  classSessionId?: number | null;
  studentId?: number | null;
  status: "present" | "absent" | "justified";
  reason?: string | null;
  recordedByTeacherId?: number | null;
  justificationId?: number | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Assessment = {
  id: number;
  classSubjectId?: number | null;
  teacherId?: number | null;
  title?: string | null;
  description?: string | null;
  maxScore?: number | null;
  weight?: number | null;
  assessmentDate?: string | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AssessmentScore = {
  id: number;
  assessmentId?: number | null;
  studentId?: number | null;
  score?: number | null;
  feedback?: string | null;
  subjectName?: string | null;
  assessmentTitle?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  updatedAt?: string | null;
};

export type StudentComment = {
  id: number;
  schoolId?: number | null;
  studentId?: number | null;
  studentName?: string | null;
  teacherId?: number | null;
  classSubjectId?: number | null;
  category: string;
  visibility: string;
  content: string;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SchoolEvent = {
  id: number;
  schoolId?: number | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdByUserId?: number | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AbsenceJustification = {
  id: number;
  attendanceRecordId?: number | null;
  guardianId?: number | null;
  reason?: string | null;
  attachmentUrl?: string | null;
  status?: string | null;
  reviewedByUserId?: number | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Notification = {
  id: number;
  userId?: number | null;
  notificationType?: string | null;
  title?: string | null;
  subject?: string | null;
  body?: string | null;
  actionUrl?: string | null;
  isRead?: boolean | null;
  readAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string | null;
};

export type StudentPerformance = {
  attendanceRate?: number | null;
  presenceRate?: number | null;
  presencePct?: number | null;
  absenceCount?: number | null;
  totalAbsences?: number | null;
  average?: number | null;
  gpa?: number | null;
  classAverage?: number | null;
};

export type ClassSummary = {
  classAverage?: number | null;
  assessmentCount?: number | null;
  belowAverageCount?: number | null;
  students?: StudentAverage[];
};

export type StudentAverage = {
  studentId: number;
  studentName: string;
  average: number;
};

export type School = {
  id: number;
  name?: string | null;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SchoolYear = {
  id: number;
  schoolId?: number | null;
  year?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export type Subject = {
  id: number;
  name?: string | null;
  code?: string | null;
  createdAt?: string | null;
};

export type ClassTeacher = {
  id: number;
  classId?: number | null;
  teacherId?: number | null;
  classSubjectId?: number | null;
  createdAt?: string | null;
};

export type Communication = {
  id: number;
  schoolId?: number | null;
  title?: string | null;
  body?: string | null;
  category?: string | null;
  priority?: string | null;
  createdByUserId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CommunicationRecipient = {
  id: number;
  communicationId?: number | null;
  userId?: number | null;
  role?: string | null;
  read?: boolean | null;
  createdAt?: string | null;
};

export type EventTarget = {
  id: number;
  eventId?: number | null;
  classId?: number | null;
  createdAt?: string | null;
};

export type AuditLog = {
  id: number;
  userId?: number | null;
  action?: string | null;
  entity?: string | null;
  entityId?: number | null;
  details?: string | null;
  createdAt?: string | null;
};
