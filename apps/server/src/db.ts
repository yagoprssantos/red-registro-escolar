import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  assessments,
  assessmentScores,
  AttendanceRecord,
  attendanceRecords,
  Class,
  classEnrollments,
  classes,
  classSubjects,
  classTeachers,
  Communication,
  communicationRecipients,
  communications,
  Contact,
  contacts,
  Guardian,
  guardians,
  InsertContact,
  InsertSchool,
  InsertUser,
  InsertUserSchool,
  School,
  schools,
  schoolStaffProfiles,
  schoolYears,
  Student,
  studentComments,
  studentGuardians,
  students,
  Subject,
  subjects,
  Teacher,
  teachers,
  User,
  users,
  UserSchool,
  userSchools,
} from "../../../drizzle/schema";
import { ENV } from "./core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pgClient: postgres.Sql | null = null;
const useMemoryStore = () =>
  process.env.NODE_ENV === "test" || !process.env.DATABASE_URL;

type MemoryStore = {
  users: User[];
  contacts: Contact[];
  schools: School[];
  userSchools: UserSchool[];
  schoolYears: Array<{
    id: number;
    schoolId: number;
    name: string;
    isCurrent: number;
  }>;
  teachers: Teacher[];
  students: Student[];
  guardians: Guardian[];
  studentGuardians: Array<{
    id: number;
    studentId: number;
    guardianId: number;
    relationship: string | null;
    isPrimary: number;
    createdAt: Date;
  }>;
  subjects: Subject[];
  classes: Class[];
  classSubjects: Array<{
    id: number;
    classId: number;
    subjectId: number;
    createdAt: Date;
  }>;
  classTeachers: Array<{
    id: number;
    classSubjectId: number;
    teacherId: number;
    createdAt: Date;
  }>;
  classEnrollments: Array<{
    id: number;
    classId: number;
    studentId: number;
    enrollmentDate: string;
    status: "ativo" | "transferido" | "concluido";
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
    category: "elogio" | "melhoria" | "ocorrencia" | "comentario";
    visibility: "student" | "guardian" | "school" | "all";
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  communications: Communication[];
  communicationRecipients: Array<{
    id: number;
    communicationId: number;
    recipientType: "student" | "guardian" | "teacher" | "staff";
    recipientRefId: number;
    readAt: Date | null;
    createdAt: Date;
  }>;
};

const memory: MemoryStore = {
  users: [],
  contacts: [],
  schools: [],
  userSchools: [],
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
};

const memoryIds = {
  users: 1,
  contacts: 1,
  schools: 1,
  userSchools: 1,
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
};

export function resetMemoryStore() {
  Object.assign(memory, {
    users: [],
    contacts: [],
    schools: [],
    userSchools: [],
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
  });

  Object.keys(memoryIds).forEach(key => {
    (memoryIds as Record<string, number>)[key] = 1;
  });
}

function getCurrentYearName() {
  return String(new Date().getFullYear());
}

async function ensureSchoolYearExists(schoolId: number) {
  if (useMemoryStore()) {
    const current = memory.schoolYears.find(
      sy => sy.schoolId === schoolId && sy.isCurrent === 1
    );
    if (current) return current.id;

    const now = new Date();
    const start = `${now.getFullYear()}-01-01`;
    const end = `${now.getFullYear()}-12-31`;
    const id = memoryIds.schoolYears++;
    memory.schoolYears.push({
      id,
      schoolId,
      name: getCurrentYearName(),
      isCurrent: 1,
    });

    return id;
  }

  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select({ id: schoolYears.id })
    .from(schoolYears)
    .where(
      and(eq(schoolYears.schoolId, schoolId), eq(schoolYears.isCurrent, 1))
    )
    .limit(1);

  if (existing[0]) return existing[0].id;

  const now = new Date();
  const startDate = `${now.getFullYear()}-01-01`;
  const endDate = `${now.getFullYear()}-12-31`;
  const created = await db
    .insert(schoolYears)
    .values({
      schoolId,
      name: getCurrentYearName(),
      startDate,
      endDate,
      isCurrent: 1,
    })
    .returning({ id: schoolYears.id });

  return created[0]?.id ?? null;
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
    const existingClass = memory.classes.find(
      c =>
        c.schoolId === schoolId &&
        c.name === "6A" &&
        c.schoolYearId === schoolYearId
    );
    if (existingClass) return existingClass.id;

    const id = memoryIds.classes++;
    memory.classes.push({
      id,
      schoolId,
      schoolYearId,
      name: "6A",
      gradeLabel: "6o Ano A",
      shift: "morning",
      status: "ativo",
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

  const existingTeacherLink = memory.classTeachers.find(
    ct => ct.classSubjectId === classSubjectId && ct.teacherId === teacherId
  );
  if (!existingTeacherLink) {
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

  const hasEnrollment = memory.classEnrollments.some(
    e => e.classId === classInSchool.id && e.studentId === studentId
  );
  if (!hasEnrollment) {
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

  const hasScore = memory.assessmentScores.some(
    score =>
      score.assessmentId === assessmentId && score.studentId === studentId
  );
  if (!hasScore) {
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

  const hasAttendance = memory.attendanceRecords.some(
    ar => ar.classSessionId === classSessionId && ar.studentId === studentId
  );
  if (!hasAttendance) {
    memory.attendanceRecords.push({
      id: memoryIds.attendanceRecords++,
      classSessionId,
      studentId,
      status: "present",
      reason: null,
      recordedByTeacherId: teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (useMemoryStore()) {
    return null;
  }

  if (!_db && process.env.DATABASE_URL) {
    try {
      _pgClient = postgres(process.env.DATABASE_URL, {
        ssl: "require",
      });
      _db = drizzle(_pgClient);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pgClient = null;
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (useMemoryStore()) {
    if (!user.openId) {
      throw new Error("User openId is required for upsert");
    }

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

  const db = await getDb();
  if (!db || !user.openId) return;

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    defaultProfile: user.defaultProfile ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        role: values.role,
        defaultProfile: values.defaultProfile,
        lastSignedIn: values.lastSignedIn,
      },
    });
}

export async function getUserByOpenId(openId: string) {
  if (useMemoryStore()) {
    return memory.users.find(user => user.openId === openId);
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
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

  const db = await getDb();
  if (!db) return null;

  const created = await db.insert(contacts).values(contact).returning();
  return created[0] ?? null;
}

export async function getContacts(limit: number = 50, offset: number = 0) {
  if (useMemoryStore()) {
    return memory.contacts.slice(offset, offset + limit);
  }

  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(contacts)
    .orderBy(desc(contacts.createdAt))
    .limit(limit)
    .offset(offset);
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
    return created;
  }

  const db = await getDb();
  if (!db) return null;

  const created = await db.insert(schools).values(school).returning();
  if (!created[0]) return null;

  await ensureSchoolYearExists(created[0].id);

  return created[0] ?? null;
}

export async function getSchoolByEmail(
  email: string
): Promise<School | undefined> {
  if (useMemoryStore()) {
    return memory.schools.find(school => school.email === email);
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(schools)
    .where(eq(schools.email, email))
    .limit(1);

  return result[0];
}

export async function getUserSchools(
  userId: number
): Promise<(UserSchool & { school: School })[]> {
  if (useMemoryStore()) {
    return memory.userSchools
      .filter(userSchool => userSchool.userId === userId)
      .map(userSchool => ({
        ...userSchool,
        school: memory.schools.find(
          school => school.id === userSchool.schoolId
        )!,
      }))
      .filter(entry => Boolean(entry.school));
  }

  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(userSchools)
    .innerJoin(schools, eq(userSchools.schoolId, schools.id))
    .where(eq(userSchools.userId, userId));

  return result.map(row => ({
    ...row.userSchools,
    school: row.schools,
  }));
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

  const db = await getDb();
  if (!db) return null;

  await db
    .insert(userSchools)
    .values(userSchool)
    .onConflictDoUpdate({
      target: [userSchools.userId, userSchools.schoolId],
      set: {
        role: userSchool.role ?? "coordinator",
      },
    });

  const created = await db
    .select()
    .from(userSchools)
    .where(
      and(
        eq(userSchools.userId, userSchool.userId),
        eq(userSchools.schoolId, userSchool.schoolId)
      )
    )
    .limit(1);

  return created[0] ?? null;
}

export async function getSchoolContacts(schoolId: number): Promise<Contact[]> {
  if (useMemoryStore()) {
    return memory.contacts.filter(c => c.schoolId === schoolId).slice(0, 100);
  }

  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(contacts)
    .where(eq(contacts.schoolId, schoolId))
    .orderBy(desc(contacts.createdAt))
    .limit(100);
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
      teacher =>
        teacher.userId === input.userId && teacher.schoolId === input.schoolId
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

  const db = await getDb();
  if (!db) return null;

  await db.insert(teachers).values({
    userId: input.userId,
    schoolId: input.schoolId,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    subject: input.subject ?? null,
    active: 1,
  });

  const created = await db
    .select()
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, input.userId),
        eq(teachers.schoolId, input.schoolId)
      )
    )
    .limit(1);

  return created[0] ?? null;
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
      guardian =>
        guardian.userId === input.userId && guardian.schoolId === input.schoolId
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memory.guardians.push(created);
    return created;
  }

  const db = await getDb();
  if (!db) return null;

  await db.insert(guardians).values({
    userId: input.userId,
    schoolId: input.schoolId,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    relationship: input.relationship ?? null,
  });

  const created = await db
    .select()
    .from(guardians)
    .where(
      and(
        eq(guardians.userId, input.userId),
        eq(guardians.schoolId, input.schoolId)
      )
    )
    .limit(1);

  return created[0] ?? null;
}

export async function createSchoolStaffProfile(input: {
  userId: number;
  schoolId: number;
  role: "admin" | "director" | "coordinator";
  positionTitle?: string | null;
}) {
  if (useMemoryStore()) {
    const existing = memory.userSchools.find(
      us => us.userId === input.userId && us.schoolId === input.schoolId
    );
    if (existing) {
      return existing;
    }

    const created: UserSchool = {
      id: memoryIds.userSchools++,
      userId: input.userId,
      schoolId: input.schoolId,
      role:
        input.role === "coordinator"
          ? "coordinator"
          : input.role === "director"
            ? "director"
            : "admin",
      createdAt: new Date(),
    };
    memory.userSchools.push(created);
    return created;
  }

  const db = await getDb();
  if (!db) return null;

  await db.insert(schoolStaffProfiles).values({
    userId: input.userId,
    schoolId: input.schoolId,
    role: input.role,
    positionTitle: input.positionTitle ?? null,
  });

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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memory.students.push(created);
    seedStudentAcademicDataInMemory(created.id, created.schoolId);
    return created;
  }

  const db = await getDb();
  if (!db) return null;

  const created = await db
    .insert(students)
    .values({
      userId: input.userId ?? null,
      schoolId: input.schoolId,
      enrollmentNumber: `MAT-${Date.now()}-${Math.round(Math.random() * 9999)}`,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      grade: input.grade ?? null,
      status: "ativo",
    })
    .returning();

  return created[0] ?? null;
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

  const db = await getDb();
  if (!db) return null;

  await db.insert(studentGuardians).values({
    studentId: input.studentId,
    guardianId: input.guardianId,
    relationship: input.relationship ?? null,
    isPrimary: input.isPrimary ?? 0,
  });

  const created = await db
    .select()
    .from(studentGuardians)
    .where(
      and(
        eq(studentGuardians.studentId, input.studentId),
        eq(studentGuardians.guardianId, input.guardianId)
      )
    )
    .limit(1);

  return created[0] ?? null;
}

export async function createStudentComment(input: {
  schoolId: number;
  studentId: number;
  teacherId?: number | null;
  classSubjectId?: number | null;
  category?: "elogio" | "melhoria" | "ocorrencia" | "comentario";
  visibility?: "student" | "guardian" | "school" | "all";
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

  const db = await getDb();
  if (!db) return null;

  const created = await db
    .insert(studentComments)
    .values({
      schoolId: input.schoolId,
      studentId: input.studentId,
      teacherId: input.teacherId ?? null,
      classSubjectId: input.classSubjectId ?? null,
      category: input.category ?? "comentario",
      visibility: input.visibility ?? "all",
      content: input.content,
    })
    .returning();

  return created[0] ?? null;
}

export async function getStudentCommentsForViewer(
  studentId: number,
  viewer: "student" | "guardian" | "school"
) {
  if (useMemoryStore()) {
    return memory.studentComments
      .filter(comment => comment.studentId === studentId)
      .map(comment => {
        const teacher = memory.teachers.find(t => t.id === comment.teacherId);
        return {
          id: comment.id,
          category: comment.category,
          content: comment.content,
          createdAt: comment.createdAt,
          author: viewer === "student" ? null : (teacher?.name ?? null),
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: studentComments.id,
      category: studentComments.category,
      content: studentComments.content,
      createdAt: studentComments.createdAt,
      teacherName: teachers.name,
    })
    .from(studentComments)
    .leftJoin(teachers, eq(studentComments.teacherId, teachers.id))
    .where(eq(studentComments.studentId, studentId))
    .orderBy(desc(studentComments.createdAt));

  return rows.map(row => ({
    id: row.id,
    category: row.category,
    content: row.content,
    createdAt: row.createdAt,
    author: viewer === "student" ? null : row.teacherName,
  }));
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
      classes: teacherClasses,
      students: totalStudents,
    };
  }

  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ teacher: teachers, schoolName: schools.name })
    .from(teachers)
    .innerJoin(schools, eq(teachers.schoolId, schools.id))
    .where(eq(teachers.userId, userId))
    .limit(1);

  if (!result[0]) return null;

  const teacherClasses = await getTeacherClasses(userId);
  const totalStudents = teacherClasses.reduce(
    (acc, curr) => acc + curr.students,
    0
  );

  return {
    id: result[0].teacher.id,
    name: result[0].teacher.name,
    email: result[0].teacher.email,
    subject: result[0].teacher.subject,
    school: result[0].schoolName,
    classes: teacherClasses,
    students: totalStudents,
  };
}

export async function getTeacherClasses(userId: number) {
  if (useMemoryStore()) {
    const teacher = memory.teachers.find(t => t.userId === userId);
    if (!teacher) return [];

    const teacherClassSubjects = memory.classTeachers.filter(
      ct => ct.teacherId === teacher.id
    );

    return teacherClassSubjects.map(ct => {
      const classSubject = memory.classSubjects.find(
        cs => cs.id === ct.classSubjectId
      )!;
      const classInfo = memory.classes.find(
        c => c.id === classSubject.classId
      )!;
      const subjectInfo = memory.subjects.find(
        s => s.id === classSubject.subjectId
      )!;
      const studentsCount = memory.classEnrollments.filter(
        enrollment =>
          enrollment.classId === classInfo.id && enrollment.status === "ativo"
      ).length;

      return {
        id: classInfo.id,
        name: classInfo.name,
        subject: subjectInfo.name,
        students: studentsCount,
      };
    });
  }

  const db = await getDb();
  if (!db) return [];

  const teacherData = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);

  if (!teacherData[0]) return [];

  const teacherId = teacherData[0].id;

  const rows = await db
    .select({
      classId: classes.id,
      className: classes.name,
      subjectName: subjects.name,
      studentsCount: sql<number>`count(${classEnrollments.id})`,
    })
    .from(classTeachers)
    .innerJoin(
      classSubjects,
      eq(classTeachers.classSubjectId, classSubjects.id)
    )
    .innerJoin(classes, eq(classSubjects.classId, classes.id))
    .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
    .leftJoin(
      classEnrollments,
      and(
        eq(classEnrollments.classId, classes.id),
        eq(classEnrollments.status, "ativo")
      )
    )
    .where(eq(classTeachers.teacherId, teacherId))
    .groupBy(classes.id, classes.name, subjects.name);

  return rows.map(row => ({
    id: row.classId,
    name: row.className,
    subject: row.subjectName,
    students: Number(row.studentsCount ?? 0),
  }));
}

export async function getTeacherClassGrades(userId: number, classId: number) {
  if (useMemoryStore()) {
    const teacher = memory.teachers.find(t => t.userId === userId);
    if (!teacher) return [];

    const allowedClassSubjectIds = memory.classTeachers
      .filter(ct => ct.teacherId === teacher.id)
      .map(ct => ct.classSubjectId);

    const classSubjectIds = memory.classSubjects
      .filter(
        cs => cs.classId === classId && allowedClassSubjectIds.includes(cs.id)
      )
      .map(cs => cs.id);

    if (classSubjectIds.length === 0) return [];

    const assessmentIds = memory.assessments
      .filter(a => classSubjectIds.includes(a.classSubjectId))
      .map(a => a.id);

    return memory.assessmentScores
      .filter(score => assessmentIds.includes(score.assessmentId))
      .map(score => {
        const assessment = memory.assessments.find(
          a => a.id === score.assessmentId
        )!;
        const student = memory.students.find(s => s.id === score.studentId)!;
        return {
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          studentId: student.id,
          studentName: student.name,
          grade: Number(score.score),
          date: assessment.assessmentDate,
        };
      });
  }

  const db = await getDb();
  if (!db) return [];

  const teacherData = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);
  if (!teacherData[0]) return [];

  const teacherId = teacherData[0].id;

  const rows = await db
    .select({
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      studentId: students.id,
      studentName: students.name,
      grade: assessmentScores.score,
      date: assessments.assessmentDate,
    })
    .from(assessmentScores)
    .innerJoin(assessments, eq(assessmentScores.assessmentId, assessments.id))
    .innerJoin(classSubjects, eq(assessments.classSubjectId, classSubjects.id))
    .innerJoin(
      classTeachers,
      eq(classSubjects.id, classTeachers.classSubjectId)
    )
    .innerJoin(students, eq(assessmentScores.studentId, students.id))
    .where(
      and(
        eq(classSubjects.classId, classId),
        eq(classTeachers.teacherId, teacherId)
      )
    );

  return rows.map(row => ({
    ...row,
    grade: Number(row.grade),
  }));
}

export async function getStudentProfile(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return null;

    const school = memory.schools.find(s => s.id === student.schoolId);
    const studentGrades = memory.assessmentScores.filter(
      score => score.studentId === student.id
    );
    const average =
      studentGrades.length > 0
        ? studentGrades.reduce((acc, item) => acc + Number(item.score), 0) /
          studentGrades.length
        : 0;

    const absences = memory.attendanceRecords.filter(
      attendance =>
        attendance.studentId === student.id && attendance.status === "absent"
    ).length;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      grade: student.grade,
      school: school?.name ?? null,
      averageGrade: Number(average.toFixed(2)),
      absences,
    };
  }

  const db = await getDb();
  if (!db) return null;

  const studentRows = await db
    .select({ student: students, schoolName: schools.name })
    .from(students)
    .innerJoin(schools, eq(students.schoolId, schools.id))
    .where(eq(students.userId, userId))
    .limit(1);

  if (!studentRows[0]) return null;

  const student = studentRows[0].student;

  const scoreRows = await db
    .select({ score: assessmentScores.score })
    .from(assessmentScores)
    .where(eq(assessmentScores.studentId, student.id));

  const average =
    scoreRows.length > 0
      ? scoreRows.reduce((acc, current) => acc + Number(current.score), 0) /
        scoreRows.length
      : 0;

  const absentRows = await db
    .select({ total: sql<number>`count(*)` })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.studentId, student.id),
        eq(attendanceRecords.status, "absent")
      )
    );

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    grade: student.grade,
    school: studentRows[0].schoolName,
    averageGrade: Number(average.toFixed(2)),
    absences: Number(absentRows[0]?.total ?? 0),
  };
}

export async function getStudentGrades(userId: number) {
  if (useMemoryStore()) {
    const student = memory.students.find(s => s.userId === userId);
    if (!student) return [];

    return memory.assessmentScores
      .filter(score => score.studentId === student.id)
      .map(score => {
        const assessment = memory.assessments.find(
          a => a.id === score.assessmentId
        )!;
        const classSubject = memory.classSubjects.find(
          cs => cs.id === assessment.classSubjectId
        )!;
        const subject = memory.subjects.find(
          s => s.id === classSubject.subjectId
        )!;

        return {
          subject: subject.name,
          grade: Number(score.score),
          date: assessment.assessmentDate,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  const db = await getDb();
  if (!db) return [];

  const studentRows = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);
  if (!studentRows[0]) return [];

  const studentId = studentRows[0].id;

  const rows = await db
    .select({
      subject: subjects.name,
      grade: assessmentScores.score,
      date: assessments.assessmentDate,
    })
    .from(assessmentScores)
    .innerJoin(assessments, eq(assessmentScores.assessmentId, assessments.id))
    .innerJoin(classSubjects, eq(assessments.classSubjectId, classSubjects.id))
    .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
    .where(eq(assessmentScores.studentId, studentId))
    .orderBy(desc(assessments.assessmentDate));

  return rows.map(row => ({
    subject: row.subject,
    grade: Number(row.grade),
    date: row.date,
  }));
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

    const schoolCommunications = memory.communications
      .filter(c => c.schoolId === student.schoolId)
      .map(c => c.id);

    const communicationIds = Array.from(
      new Set([...directIds, ...schoolCommunications])
    );

    return memory.communications
      .filter(c => communicationIds.includes(c.id))
      .map(c => ({
        id: c.id,
        title: c.title,
        body: c.body,
        type: c.communicationType,
        createdAt: c.createdAt,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const db = await getDb();
  if (!db) return [];

  const studentRows = await db
    .select({ id: students.id, schoolId: students.schoolId })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);

  if (!studentRows[0]) return [];

  const studentId = studentRows[0].id;
  const schoolId = studentRows[0].schoolId;

  const direct = await db
    .select({
      id: communications.id,
      title: communications.title,
      body: communications.body,
      type: communications.communicationType,
      createdAt: communications.createdAt,
    })
    .from(communicationRecipients)
    .innerJoin(
      communications,
      eq(communicationRecipients.communicationId, communications.id)
    )
    .where(
      and(
        eq(communicationRecipients.recipientType, "student"),
        eq(communicationRecipients.recipientRefId, studentId)
      )
    );

  const broad = await db
    .select({
      id: communications.id,
      title: communications.title,
      body: communications.body,
      type: communications.communicationType,
      createdAt: communications.createdAt,
    })
    .from(communications)
    .where(eq(communications.schoolId, schoolId));

  const map = new Map<number, (typeof direct)[number]>();
  [...direct, ...broad].forEach(entry => {
    map.set(entry.id, entry);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
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
      students: await getGuardianStudents(userId),
    };
  }

  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(guardians)
    .where(eq(guardians.userId, userId))
    .limit(1);

  if (!rows[0]) return null;

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    relationship: rows[0].relationship,
    students: await getGuardianStudents(userId),
  };
}

export async function getGuardianStudents(userId: number) {
  if (useMemoryStore()) {
    const guardian = memory.guardians.find(g => g.userId === userId);
    if (!guardian) return [];

    const links = memory.studentGuardians.filter(
      sg => sg.guardianId === guardian.id
    );

    return links
      .map(link => {
        const student = memory.students.find(s => s.id === link.studentId);
        if (!student) return null;

        const scores = memory.assessmentScores.filter(
          score => score.studentId === student.id
        );
        const average =
          scores.length > 0
            ? scores.reduce((acc, item) => acc + Number(item.score), 0) /
              scores.length
            : 0;

        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          averageGrade: Number(average.toFixed(2)),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  const db = await getDb();
  if (!db) return [];

  const guardianRows = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(eq(guardians.userId, userId))
    .limit(1);

  if (!guardianRows[0]) return [];

  const guardianId = guardianRows[0].id;

  const links = await db
    .select({ studentId: studentGuardians.studentId })
    .from(studentGuardians)
    .where(eq(studentGuardians.guardianId, guardianId));

  if (links.length === 0) return [];

  const studentIds = links.map(link => link.studentId);

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      grade: students.grade,
    })
    .from(students)
    .where(inArray(students.id, studentIds));

  const scoreRows = await db
    .select({
      studentId: assessmentScores.studentId,
      score: assessmentScores.score,
    })
    .from(assessmentScores)
    .where(inArray(assessmentScores.studentId, studentIds));

  const grouped = new Map<number, number[]>();
  scoreRows.forEach(row => {
    const existing = grouped.get(row.studentId) ?? [];
    existing.push(Number(row.score));
    grouped.set(row.studentId, existing);
  });

  return rows.map(row => {
    const scores = grouped.get(row.id) ?? [];
    const average =
      scores.length > 0
        ? scores.reduce((acc, score) => acc + score, 0) / scores.length
        : 0;

    return {
      id: row.id,
      name: row.name,
      grade: row.grade,
      averageGrade: Number(average.toFixed(2)),
    };
  });
}

export async function getGuardianStudentPerformance(
  userId: number,
  studentId: number
) {
  if (useMemoryStore()) {
    const guardian = memory.guardians.find(g => g.userId === userId);
    if (!guardian) return null;

    const hasLink = memory.studentGuardians.some(
      sg => sg.guardianId === guardian.id && sg.studentId === studentId
    );
    if (!hasLink) return null;

    const grades = await getStudentGradesForStudentId(studentId);
    const absences = memory.attendanceRecords.filter(
      ar => ar.studentId === studentId && ar.status === "absent"
    ).length;

    const alerts = memory.studentComments
      .filter(
        comment =>
          comment.studentId === studentId &&
          (comment.category === "ocorrencia" || comment.category === "melhoria")
      )
      .map(comment => {
        const teacherName = memory.teachers.find(
          t => t.id === comment.teacherId
        )?.name;
        return teacherName
          ? `${comment.category.toUpperCase()}: ${comment.content} (${teacherName})`
          : `${comment.category.toUpperCase()}: ${comment.content}`;
      });

    return {
      studentId,
      grades,
      absences,
      alerts,
    };
  }

  const db = await getDb();
  if (!db) return null;

  const guardianRows = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(eq(guardians.userId, userId))
    .limit(1);

  if (!guardianRows[0]) return null;

  const guardianId = guardianRows[0].id;

  const link = await db
    .select({ id: studentGuardians.id })
    .from(studentGuardians)
    .where(
      and(
        eq(studentGuardians.guardianId, guardianId),
        eq(studentGuardians.studentId, studentId)
      )
    )
    .limit(1);

  if (!link[0]) return null;

  const grades = await getStudentGradesForStudentId(studentId);

  const absentRows = await db
    .select({ total: sql<number>`count(*)` })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.studentId, studentId),
        eq(attendanceRecords.status, "absent")
      )
    );

  const commentRows = await db
    .select({
      category: studentComments.category,
      content: studentComments.content,
      teacherName: teachers.name,
    })
    .from(studentComments)
    .leftJoin(teachers, eq(studentComments.teacherId, teachers.id))
    .where(
      and(
        eq(studentComments.studentId, studentId),
        inArray(studentComments.category, ["ocorrencia", "melhoria"])
      )
    )
    .orderBy(desc(studentComments.createdAt));

  const alerts = commentRows.map(row =>
    row.teacherName
      ? `${row.category.toUpperCase()}: ${row.content} (${row.teacherName})`
      : `${row.category.toUpperCase()}: ${row.content}`
  );

  return {
    studentId,
    grades,
    absences: Number(absentRows[0]?.total ?? 0),
    alerts,
  };
}

async function getStudentGradesForStudentId(studentId: number) {
  if (useMemoryStore()) {
    return memory.assessmentScores
      .filter(score => score.studentId === studentId)
      .map(score => {
        const assessment = memory.assessments.find(
          a => a.id === score.assessmentId
        )!;
        const classSubject = memory.classSubjects.find(
          cs => cs.id === assessment.classSubjectId
        )!;
        const subject = memory.subjects.find(
          s => s.id === classSubject.subjectId
        )!;

        return {
          subject: subject.name,
          grade: Number(score.score),
          date: assessment.assessmentDate,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      subject: subjects.name,
      grade: assessmentScores.score,
      date: assessments.assessmentDate,
    })
    .from(assessmentScores)
    .innerJoin(assessments, eq(assessmentScores.assessmentId, assessments.id))
    .innerJoin(classSubjects, eq(assessments.classSubjectId, classSubjects.id))
    .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
    .where(eq(assessmentScores.studentId, studentId))
    .orderBy(desc(assessments.assessmentDate));

  return rows.map(row => ({
    subject: row.subject,
    grade: Number(row.grade),
    date: row.date,
  }));
}
