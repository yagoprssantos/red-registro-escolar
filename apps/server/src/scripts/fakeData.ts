import { inArray, like, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assessments,
  assessmentScores,
  attachments,
  attendanceRecords,
  classEnrollments,
  classes,
  classSessions,
  classSubjects,
  classTeachers,
  communicationRecipients,
  communications,
  contacts,
  eventTargets,
  guardians,
  notifications,
  schoolEvents,
  schools,
  schoolStaffProfiles,
  schoolYears,
  studentComments,
  studentGuardians,
  students,
  subjects,
  teachers,
  users,
  userSchools,
} from "../../../../drizzle/schema";

type Db = PostgresJsDatabase<typeof import("../../../../drizzle/schema")>;

type SeedCategory = "school" | "teacher" | "student" | "guardian";

type CategoryPasswords = Record<SeedCategory, string>;

export type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

type ClearFakeDataOptions = {
  supabase?: SupabaseAdminConfig;
};

type SeedFakeDataOptions = {
  supabase: SupabaseAdminConfig;
  categoryPasswords: CategoryPasswords;
};

type LoginCredential = {
  name: string;
  email: string;
  school: string;
  password: string;
};

export type SeedResult = {
  schoolIds: number[];
  userEmails: string[];
  studentNames: string[];
  totals: {
    schools: number;
    teachers: number;
    students: number;
    guardians: number;
  };
  credentialsByCategory: Record<SeedCategory, LoginCredential[]>;
  removedSupabaseAuthUsersOnReset: number;
};

export type ClearResult = {
  removedSchools: number;
  removedUsers: number;
  removedSupabaseAuthUsers: number;
};

type SupabaseAdminUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

type SchoolSeed = {
  slug: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

type SchoolAccountSeed = {
  category: "school";
  schoolSlug: string;
  schoolName: string;
  schoolEmail: string;
  name: string;
  email: string;
  schoolRole: "admin" | "coordinator";
};

type TeacherSeed = {
  category: "teacher";
  schoolSlug: string;
  schoolName: string;
  schoolEmail: string;
  name: string;
  email: string;
  subject: string;
};

type StudentSeed = {
  category: "student";
  schoolSlug: string;
  schoolName: string;
  schoolEmail: string;
  name: string;
  email: string;
  grade: "6o Ano" | "7o Ano" | "8o Ano";
  dateOfBirth: string;
  enrollmentNumber: string;
};

type GuardianSeed = {
  category: "guardian";
  schoolSlug: string;
  schoolName: string;
  schoolEmail: string;
  name: string;
  email: string;
  relationship: "Mae" | "Pai" | "Responsavel";
};

type UserSeed = SchoolAccountSeed | TeacherSeed | StudentSeed | GuardianSeed;

type SupabaseSeedAccount = {
  name: string;
  email: string;
  category: SeedCategory;
  schoolSlug: string;
  profile: "school" | "teacher" | "student" | "guardian";
  password: string;
};

const FAKE_DOMAIN = "demo.red.local";
const FAKE_OPEN_ID_PREFIX = "seed:fake:";
const FAKE_SCHOOL_NAME_PREFIX = "Escola Demo RED";
const FAKE_ATTACHMENT_URL_PREFIX = "https://demo.red.local/";
const FAKE_SUPABASE_MARKER = "red-fake-seed-v2";

const STUDENT_FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elisa",
  "Felipe",
  "Gabriela",
  "Hugo",
  "Isabela",
  "Joao",
  "Karen",
  "Lucas",
  "Marina",
  "Nicolas",
  "Olivia",
  "Paulo",
  "Queila",
  "Rafael",
  "Sofia",
  "Tiago",
];

const GUARDIAN_FIRST_NAMES = [
  "Adriana",
  "Beatriz",
  "Carlos",
  "Denise",
  "Eduardo",
  "Fernanda",
  "Gustavo",
  "Helena",
  "Igor",
  "Juliana",
  "Katia",
  "Leandro",
  "Monica",
  "Nelson",
  "Patricia",
  "Roberto",
  "Silvia",
  "Tatiana",
  "Ursula",
  "Valter",
  "Wagner",
  "Ximena",
  "Yasmin",
  "Zuleica",
  "Aline",
  "Bianca",
  "Caio",
  "Debora",
  "Erica",
  "Fabio",
];

const LAST_NAMES = [
  "Almeida",
  "Barbosa",
  "Cardoso",
  "Dias",
  "Esteves",
  "Ferreira",
  "Gomes",
  "Henrique",
  "Ibrahim",
  "Junqueira",
  "Klein",
  "Lemos",
  "Medeiros",
  "Nunes",
  "Oliveira",
  "Pereira",
  "Queiroz",
  "Ramos",
  "Silva",
  "Teixeira",
  "Uchoa",
  "Vieira",
  "Werneck",
  "Xavier",
  "Yamada",
  "Zanetti",
];

const SCHOOL_SUBJECTS = ["Matematica", "Portugues", "Ciencias", "Historia"];

const CATEGORY_LABELS: Record<SeedCategory, string> = {
  school: "Escola",
  teacher: "Professor",
  student: "Aluno",
  guardian: "Responsavel",
};

function getCurrentYearWindow() {
  const year = new Date().getFullYear();
  return {
    year,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureSupabaseConfig(
  config?: SupabaseAdminConfig
): SupabaseAdminConfig {
  if (!config?.url?.trim() || !config?.serviceRoleKey?.trim()) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias para sincronizar contas fake no Supabase Auth."
    );
  }

  return {
    url: config.url.trim(),
    serviceRoleKey: config.serviceRoleKey.trim(),
  };
}

async function parseJsonSafely(response: globalThis.Response) {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function supabaseAdminRequest<T>(
  config: SupabaseAdminConfig,
  path: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(`${normalizeSupabaseUrl(config.url)}${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    throw new Error(
      `Supabase Auth request failed (${response.status}) on ${path}: ${JSON.stringify(payload)}`
    );
  }

  return payload as T;
}

function extractSupabaseUsers(payload: unknown): SupabaseAdminUser[] {
  if (Array.isArray(payload)) {
    return payload as SupabaseAdminUser[];
  }

  if (payload && typeof payload === "object") {
    const usersCandidate = (payload as Record<string, unknown>).users;
    if (Array.isArray(usersCandidate)) {
      return usersCandidate as SupabaseAdminUser[];
    }
  }

  return [];
}

function readMetadataField(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

function isFakeSupabaseUser(user: SupabaseAdminUser) {
  const email = normalizeEmail(user.email ?? "");
  const markerFromUser = readMetadataField(user.user_metadata, "seedMarker");
  const markerFromApp = readMetadataField(user.app_metadata, "seedMarker");

  return (
    email.endsWith(`@${FAKE_DOMAIN}`) ||
    markerFromUser === FAKE_SUPABASE_MARKER ||
    markerFromApp === FAKE_SUPABASE_MARKER
  );
}

async function listSupabaseUsers(config: SupabaseAdminConfig) {
  const allUsers: SupabaseAdminUser[] = [];
  const perPage = 200;
  let page = 1;

  while (true) {
    const payload = await supabaseAdminRequest<unknown>(
      config,
      `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
      }
    );

    const pageUsers = extractSupabaseUsers(payload);
    allUsers.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

async function deleteFakeSupabaseUsers(config: SupabaseAdminConfig) {
  const usersInAuth = await listSupabaseUsers(config);
  const fakeUsers = usersInAuth.filter(isFakeSupabaseUser);

  for (const user of fakeUsers) {
    await supabaseAdminRequest<unknown>(
      config,
      `/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
      {
        method: "DELETE",
      }
    );
  }

  return fakeUsers.length;
}

function toSupabaseProfile(category: SeedCategory) {
  if (category === "school") return "school" as const;
  if (category === "teacher") return "teacher" as const;
  if (category === "student") return "student" as const;
  return "guardian" as const;
}

function buildCredentialsByCategory(
  userSeeds: UserSeed[],
  categoryPasswords: CategoryPasswords
): Record<SeedCategory, LoginCredential[]> {
  const result: Record<SeedCategory, LoginCredential[]> = {
    school: [],
    teacher: [],
    student: [],
    guardian: [],
  };

  for (const seed of userSeeds) {
    result[seed.category].push({
      name: seed.name,
      email: seed.email,
      school: seed.schoolName,
      password: categoryPasswords[seed.category],
    });
  }

  return result;
}

function buildSchoolSeeds(year: number): SchoolSeed[] {
  return [
    {
      slug: "norte",
      name: `${FAKE_SCHOOL_NAME_PREFIX} Norte ${year}`,
      email: `contato.norte@${FAKE_DOMAIN}`,
      phone: "11980000001",
      address: "Rua das Laranjeiras, 120",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01000-001",
    },
    {
      slug: "sul",
      name: `${FAKE_SCHOOL_NAME_PREFIX} Sul ${year}`,
      email: `contato.sul@${FAKE_DOMAIN}`,
      phone: "11980000002",
      address: "Av. Central, 550",
      city: "Sao Bernardo do Campo",
      state: "SP",
      zipCode: "09600-100",
    },
  ];
}

function buildSchoolAccountSeeds(
  schoolsData: SchoolSeed[]
): SchoolAccountSeed[] {
  return schoolsData.flatMap(school => [
    {
      category: "school" as const,
      schoolSlug: school.slug,
      schoolName: school.name,
      schoolEmail: school.email,
      name: `Admin ${school.name}`,
      email: `admin.${school.slug}@${FAKE_DOMAIN}`,
      schoolRole: "admin" as const,
    },
    {
      category: "school" as const,
      schoolSlug: school.slug,
      schoolName: school.name,
      schoolEmail: school.email,
      name: `Coordenacao ${school.name}`,
      email: `coordenacao.${school.slug}@${FAKE_DOMAIN}`,
      schoolRole: "coordinator" as const,
    },
  ]);
}

function buildTeacherSeeds(schoolsData: SchoolSeed[]): TeacherSeed[] {
  const base = [
    {
      schoolSlug: "norte",
      first: "Marina",
      last: "Lopes",
      subject: "Matematica",
    },
    {
      schoolSlug: "norte",
      first: "Carlos",
      last: "Freitas",
      subject: "Ciencias",
    },
    {
      schoolSlug: "norte",
      first: "Patricia",
      last: "Moraes",
      subject: "Portugues",
    },
    {
      schoolSlug: "sul",
      first: "Renato",
      last: "Araujo",
      subject: "Matematica",
    },
    { schoolSlug: "sul", first: "Simone", last: "Barros", subject: "Historia" },
  ] as const;

  const schoolBySlug = new Map(
    schoolsData.map(school => [school.slug, school])
  );

  return base.map((item, index) => {
    const school = schoolBySlug.get(item.schoolSlug);
    if (!school) {
      throw new Error(`Missing school for slug ${item.schoolSlug}`);
    }

    const emailPrefix = makeSlug(
      `${item.first}.${item.last}.${school.slug}.${index + 1}`
    );

    return {
      category: "teacher" as const,
      schoolSlug: school.slug,
      schoolName: school.name,
      schoolEmail: school.email,
      name: `${item.first} ${item.last}`,
      email: `${emailPrefix}@${FAKE_DOMAIN}`,
      subject: item.subject,
    };
  });
}

function buildStudentSeeds(
  schoolsData: SchoolSeed[],
  year: number
): StudentSeed[] {
  const gradeCycle: Array<StudentSeed["grade"]> = [
    "6o Ano",
    "7o Ano",
    "8o Ano",
  ];

  return STUDENT_FIRST_NAMES.map((first, index) => {
    const school = index < 10 ? schoolsData[0] : schoolsData[1];
    if (!school) {
      throw new Error(`Missing school for student index ${index}`);
    }

    const last = LAST_NAMES[index % LAST_NAMES.length];
    const fullName = `${first} ${last}`;
    const emailPrefix = makeSlug(
      `${first}.${last}.${school.slug}.${index + 1}`
    );
    const grade = gradeCycle[index % gradeCycle.length];
    const birthYear = 2011 + (index % 3);
    const birthMonth = String((index % 12) + 1).padStart(2, "0");
    const birthDay = String((index % 27) + 1).padStart(2, "0");
    const sequence = String(index + 1).padStart(4, "0");

    return {
      category: "student" as const,
      schoolSlug: school.slug,
      schoolName: school.name,
      schoolEmail: school.email,
      name: fullName,
      email: `${emailPrefix}@${FAKE_DOMAIN}`,
      grade,
      dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
      enrollmentNumber: `${school.slug.toUpperCase()}-${year}-${sequence}`,
    };
  });
}

function buildGuardianSeeds(schoolsData: SchoolSeed[]): GuardianSeed[] {
  return GUARDIAN_FIRST_NAMES.map((first, index) => {
    const school = index < 15 ? schoolsData[0] : schoolsData[1];
    if (!school) {
      throw new Error(`Missing school for guardian index ${index}`);
    }

    const last = LAST_NAMES[(index + 7) % LAST_NAMES.length];
    const fullName = `${first} ${last}`;
    const emailPrefix = makeSlug(
      `${first}.${last}.${school.slug}.resp.${index + 1}`
    );

    return {
      category: "guardian" as const,
      schoolSlug: school.slug,
      schoolName: school.name,
      schoolEmail: school.email,
      name: fullName,
      email: `${emailPrefix}@${FAKE_DOMAIN}`,
      relationship:
        index % 3 === 0 ? "Pai" : index % 3 === 1 ? "Mae" : "Responsavel",
    };
  });
}

function buildSupabaseSeedAccounts(
  userSeeds: UserSeed[],
  categoryPasswords: CategoryPasswords
): SupabaseSeedAccount[] {
  return userSeeds.map(seed => ({
    name: seed.name,
    email: seed.email,
    category: seed.category,
    schoolSlug: seed.schoolSlug,
    profile: toSupabaseProfile(seed.category),
    password: categoryPasswords[seed.category],
  }));
}

async function createOrUpdateSupabaseAccounts(
  config: SupabaseAdminConfig,
  accounts: SupabaseSeedAccount[]
): Promise<Array<SupabaseSeedAccount & { id: string }>> {
  const existingUsers = await listSupabaseUsers(config);
  const existingByEmail = new Map(
    existingUsers
      .filter(user => Boolean(user.email))
      .map(user => [normalizeEmail(user.email ?? ""), user])
  );

  const created: Array<SupabaseSeedAccount & { id: string }> = [];

  for (const account of accounts) {
    const normalizedEmail = normalizeEmail(account.email);
    const existing = existingByEmail.get(normalizedEmail);

    const payload = {
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.name,
        defaultProfile: account.profile,
        profile: account.profile,
        category: account.category,
        schoolSlug: account.schoolSlug,
        seedMarker: FAKE_SUPABASE_MARKER,
      },
      app_metadata: {
        category: account.category,
        profile: account.profile,
        seedMarker: FAKE_SUPABASE_MARKER,
      },
    };

    const response = existing
      ? await supabaseAdminRequest<unknown>(
          config,
          `/auth/v1/admin/users/${encodeURIComponent(existing.id)}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        )
      : await supabaseAdminRequest<unknown>(config, "/auth/v1/admin/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    const idCandidate =
      (response && typeof response === "object" && "id" in response
        ? (response as Record<string, unknown>).id
        : null) ??
      (response && typeof response === "object" && "user" in response
        ? (response as { user?: { id?: unknown } }).user?.id
        : null) ??
      existing?.id;

    if (typeof idCandidate !== "string" || !idCandidate) {
      throw new Error(
        `Could not resolve Supabase user id for ${account.email}`
      );
    }

    created.push({ ...account, id: idCandidate });
  }

  return created;
}

export async function clearFakeData(
  db: Db,
  options: ClearFakeDataOptions = {}
): Promise<ClearResult> {
  const fakeSchools = await db
    .select({ id: schools.id })
    .from(schools)
    .where(
      or(
        like(schools.email, `%@${FAKE_DOMAIN}`),
        like(schools.name, `${FAKE_SCHOOL_NAME_PREFIX}%`)
      )
    );

  const fakeUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        like(users.openId, `${FAKE_OPEN_ID_PREFIX}%`),
        like(users.email, `%@${FAKE_DOMAIN}`)
      )
    );

  const schoolIds = fakeSchools.map(row => row.id);
  const userIds = fakeUsers.map(row => row.id);

  await db.transaction(async tx => {
    await tx
      .delete(attachments)
      .where(like(attachments.fileUrl, `${FAKE_ATTACHMENT_URL_PREFIX}%`));

    if (schoolIds.length > 0) {
      await tx
        .delete(contacts)
        .where(
          or(
            inArray(contacts.schoolId, schoolIds),
            like(contacts.email, `%@${FAKE_DOMAIN}`)
          )
        );
      await tx.delete(schools).where(inArray(schools.id, schoolIds));
    } else {
      await tx.delete(contacts).where(like(contacts.email, `%@${FAKE_DOMAIN}`));
    }

    if (userIds.length > 0) {
      await tx.delete(users).where(inArray(users.id, userIds));
    }
  });

  let removedSupabaseAuthUsers = 0;
  if (options.supabase) {
    const config = ensureSupabaseConfig(options.supabase);
    removedSupabaseAuthUsers = await deleteFakeSupabaseUsers(config);
  }

  return {
    removedSchools: schoolIds.length,
    removedUsers: userIds.length,
    removedSupabaseAuthUsers,
  };
}

export async function seedFakeData(
  db: Db,
  options: SeedFakeDataOptions
): Promise<SeedResult> {
  const supabaseConfig = ensureSupabaseConfig(options.supabase);
  const categoryPasswords = options.categoryPasswords;

  const resetInfo = await clearFakeData(db, { supabase: supabaseConfig });

  const { year, startDate, endDate } = getCurrentYearWindow();

  const schoolSeeds = buildSchoolSeeds(year);
  const schoolAccountSeeds = buildSchoolAccountSeeds(schoolSeeds);
  const teacherSeeds = buildTeacherSeeds(schoolSeeds);
  const studentSeeds = buildStudentSeeds(schoolSeeds, year);
  const guardianSeeds = buildGuardianSeeds(schoolSeeds);

  const userSeeds: UserSeed[] = [
    ...schoolAccountSeeds,
    ...teacherSeeds,
    ...studentSeeds,
    ...guardianSeeds,
  ];

  const authAccounts = buildSupabaseSeedAccounts(userSeeds, categoryPasswords);
  const createdAuthUsers = await createOrUpdateSupabaseAccounts(
    supabaseConfig,
    authAccounts
  );

  const supabaseIdByEmail = new Map(
    createdAuthUsers.map(account => [normalizeEmail(account.email), account.id])
  );

  return await db.transaction(async tx => {
    const createdSchools = await tx
      .insert(schools)
      .values(
        schoolSeeds.map(seed => ({
          name: seed.name,
          email: seed.email,
          phone: seed.phone,
          address: seed.address,
          city: seed.city,
          state: seed.state,
          zipCode: seed.zipCode,
          studentCount: studentSeeds.filter(
            student => student.schoolSlug === seed.slug
          ).length,
          status: "ativo",
        }))
      )
      .returning({ id: schools.id, name: schools.name, email: schools.email });

    const schoolIdBySlug = new Map<string, number>();
    createdSchools.forEach(created => {
      const seed = schoolSeeds.find(row => row.email === created.email);
      if (!seed) {
        throw new Error(`Could not map created school ${created.email}`);
      }
      schoolIdBySlug.set(seed.slug, created.id);
    });

    const createdSchoolYears = await tx
      .insert(schoolYears)
      .values(
        createdSchools.map(school => ({
          schoolId: school.id,
          name: String(year),
          startDate,
          endDate,
          isCurrent: 1,
        }))
      )
      .returning({ id: schoolYears.id, schoolId: schoolYears.schoolId });

    const schoolYearBySchoolId = new Map(
      createdSchoolYears.map(row => [row.schoolId, row.id])
    );

    const requireSchoolId = (slug: string) => {
      const value = schoolIdBySlug.get(slug);
      if (!value) {
        throw new Error(`School not found for slug ${slug}`);
      }
      return value;
    };

    const localUserValues = userSeeds.map(seed => {
      const supabaseId = supabaseIdByEmail.get(normalizeEmail(seed.email));
      if (!supabaseId) {
        throw new Error(`Supabase id missing for ${seed.email}`);
      }

      if (seed.category === "school") {
        return {
          openId: `supabase:${supabaseId}`,
          name: seed.name,
          email: seed.email,
          loginMethod: "supabase-password-seed",
          role:
            seed.schoolRole === "admin"
              ? ("admin" as const)
              : ("school_staff" as const),
          defaultProfile: "school" as const,
        };
      }

      if (seed.category === "teacher") {
        return {
          openId: `supabase:${supabaseId}`,
          name: seed.name,
          email: seed.email,
          loginMethod: "supabase-password-seed",
          role: "teacher" as const,
          defaultProfile: "teacher" as const,
        };
      }

      if (seed.category === "student") {
        return {
          openId: `supabase:${supabaseId}`,
          name: seed.name,
          email: seed.email,
          loginMethod: "supabase-password-seed",
          role: "student" as const,
          defaultProfile: "student" as const,
        };
      }

      return {
        openId: `supabase:${supabaseId}`,
        name: seed.name,
        email: seed.email,
        loginMethod: "supabase-password-seed",
        role: "guardian" as const,
        defaultProfile: "guardian" as const,
      };
    });

    const createdUsers = await tx
      .insert(users)
      .values(localUserValues)
      .returning({ id: users.id, email: users.email });

    const userIdByEmail = new Map(
      createdUsers
        .filter(row => Boolean(row.email))
        .map(row => [normalizeEmail(String(row.email)), row.id])
    );

    const requireUserId = (email: string) => {
      const value = userIdByEmail.get(normalizeEmail(email));
      if (!value) {
        throw new Error(`User not found for email ${email}`);
      }
      return value;
    };

    await tx.insert(userSchools).values(
      userSeeds.map(seed => {
        let role:
          | "admin"
          | "director"
          | "coordinator"
          | "teacher"
          | "guardian"
          | "student" = "student";
        if (seed.category === "school") {
          role = seed.schoolRole === "admin" ? "admin" : "coordinator";
        } else if (seed.category === "teacher") {
          role = "teacher";
        } else if (seed.category === "student") {
          role = "student";
        } else {
          role = "guardian";
        }

        return {
          userId: requireUserId(seed.email),
          schoolId: requireSchoolId(seed.schoolSlug),
          role,
        };
      })
    );

    await tx.insert(schoolStaffProfiles).values(
      schoolAccountSeeds.map(seed => ({
        userId: requireUserId(seed.email),
        schoolId: requireSchoolId(seed.schoolSlug),
        role:
          seed.schoolRole === "admin"
            ? ("admin" as const)
            : ("coordinator" as const),
        positionTitle:
          seed.schoolRole === "admin"
            ? "Diretoria Geral"
            : "Coordenacao Pedagogica",
      }))
    );

    const createdTeachers = await tx
      .insert(teachers)
      .values(
        teacherSeeds.map((seed, index) => ({
          userId: requireUserId(seed.email),
          schoolId: requireSchoolId(seed.schoolSlug),
          name: seed.name,
          email: seed.email,
          phone: `11991${String(100000 + index).slice(-6)}`,
          subject: seed.subject,
          active: 1,
        }))
      )
      .returning({
        id: teachers.id,
        schoolId: teachers.schoolId,
        email: teachers.email,
        subject: teachers.subject,
      });

    const createdStudents = await tx
      .insert(students)
      .values(
        studentSeeds.map((seed, index) => ({
          userId: requireUserId(seed.email),
          schoolId: requireSchoolId(seed.schoolSlug),
          enrollmentNumber: seed.enrollmentNumber,
          name: seed.name,
          email: seed.email,
          phone: `11992${String(200000 + index).slice(-6)}`,
          dateOfBirth: seed.dateOfBirth,
          grade: seed.grade,
          status: "ativo" as const,
        }))
      )
      .returning({
        id: students.id,
        schoolId: students.schoolId,
        email: students.email,
        name: students.name,
        grade: students.grade,
      });

    const createdGuardians = await tx
      .insert(guardians)
      .values(
        guardianSeeds.map((seed, index) => ({
          userId: requireUserId(seed.email),
          schoolId: requireSchoolId(seed.schoolSlug),
          name: seed.name,
          email: seed.email,
          phone: `11993${String(300000 + index).slice(-6)}`,
          relationship: seed.relationship,
        }))
      )
      .returning({
        id: guardians.id,
        schoolId: guardians.schoolId,
        email: guardians.email,
      });

    const studentIdByEmail = new Map(
      createdStudents
        .filter(row => Boolean(row.email))
        .map(row => [normalizeEmail(String(row.email)), row.id])
    );

    const guardianIdByEmail = new Map(
      createdGuardians
        .filter(row => Boolean(row.email))
        .map(row => [normalizeEmail(String(row.email)), row.id])
    );

    const requireStudentId = (email: string) => {
      const value = studentIdByEmail.get(normalizeEmail(email));
      if (!value) {
        throw new Error(`Student not found for email ${email}`);
      }
      return value;
    };

    const requireGuardianId = (email: string) => {
      const value = guardianIdByEmail.get(normalizeEmail(email));
      if (!value) {
        throw new Error(`Guardian not found for email ${email}`);
      }
      return value;
    };

    const studentGuardianValues: Array<{
      studentId: number;
      guardianId: number;
      relationship: string;
      isPrimary: number;
    }> = [];

    for (const school of schoolSeeds) {
      const studentsInSchool = studentSeeds.filter(
        seed => seed.schoolSlug === school.slug
      );
      const guardiansInSchool = guardianSeeds.filter(
        seed => seed.schoolSlug === school.slug
      );

      studentsInSchool.forEach((studentSeed, index) => {
        const guardianSeed = guardiansInSchool[index];
        if (!guardianSeed) return;

        studentGuardianValues.push({
          studentId: requireStudentId(studentSeed.email),
          guardianId: requireGuardianId(guardianSeed.email),
          relationship: guardianSeed.relationship,
          isPrimary: 1,
        });
      });

      guardiansInSchool
        .slice(studentsInSchool.length)
        .forEach((guardianSeed, index) => {
          const studentSeed = studentsInSchool[index % studentsInSchool.length];
          if (!studentSeed) return;

          studentGuardianValues.push({
            studentId: requireStudentId(studentSeed.email),
            guardianId: requireGuardianId(guardianSeed.email),
            relationship: "Responsavel",
            isPrimary: 0,
          });
        });
    }

    await tx.insert(studentGuardians).values(studentGuardianValues);

    const createdSubjects = await tx
      .insert(subjects)
      .values(
        schoolSeeds.flatMap(school =>
          SCHOOL_SUBJECTS.map(subjectName => ({
            schoolId: requireSchoolId(school.slug),
            name: subjectName,
            code: `${school.slug.toUpperCase()}-${subjectName.slice(0, 3).toUpperCase()}`,
            description: `${subjectName} - trilha ${school.name}`,
          }))
        )
      )
      .returning({
        id: subjects.id,
        schoolId: subjects.schoolId,
        name: subjects.name,
      });

    const createdClasses = await tx
      .insert(classes)
      .values(
        schoolSeeds.flatMap(school => {
          const schoolId = requireSchoolId(school.slug);
          const schoolYearId = schoolYearBySchoolId.get(schoolId);
          if (!schoolYearId) {
            throw new Error(`School year missing for school ${school.slug}`);
          }

          return [
            {
              schoolId,
              schoolYearId,
              name: "6A",
              gradeLabel: "6o Ano",
              shift: "morning" as const,
              status: "ativo" as const,
            },
            {
              schoolId,
              schoolYearId,
              name: "7A",
              gradeLabel: "7o Ano",
              shift: "morning" as const,
              status: "ativo" as const,
            },
            {
              schoolId,
              schoolYearId,
              name: "8A",
              gradeLabel: "8o Ano",
              shift: "afternoon" as const,
              status: "ativo" as const,
            },
          ];
        })
      )
      .returning({
        id: classes.id,
        schoolId: classes.schoolId,
        name: classes.name,
      });

    const classBySchoolAndName = new Map(
      createdClasses.map(row => [`${row.schoolId}:${row.name}`, row.id])
    );

    const subjectBySchoolAndName = new Map(
      createdSubjects.map(row => [`${row.schoolId}:${row.name}`, row.id])
    );

    const classSubjectPlan: Record<string, string[]> = {
      "6A": ["Matematica", "Portugues"],
      "7A": ["Matematica", "Ciencias"],
      "8A": ["Portugues", "Historia"],
    };

    const classSubjectValues: Array<{ classId: number; subjectId: number }> =
      [];

    for (const classRow of createdClasses) {
      const subjectsForClass = classSubjectPlan[classRow.name] ?? [
        "Matematica",
      ];
      for (const subjectName of subjectsForClass) {
        const subjectId = subjectBySchoolAndName.get(
          `${classRow.schoolId}:${subjectName}`
        );
        if (!subjectId) {
          throw new Error(
            `Subject ${subjectName} missing for school ${classRow.schoolId}`
          );
        }

        classSubjectValues.push({
          classId: classRow.id,
          subjectId,
        });
      }
    }

    const createdClassSubjects = await tx
      .insert(classSubjects)
      .values(classSubjectValues)
      .returning({
        id: classSubjects.id,
        classId: classSubjects.classId,
        subjectId: classSubjects.subjectId,
      });

    const classById = new Map(createdClasses.map(row => [row.id, row]));
    const subjectById = new Map(createdSubjects.map(row => [row.id, row]));

    const teacherBySchoolAndSubject = new Map<string, number>();
    createdTeachers.forEach(teacher => {
      if (!teacher.subject) return;
      teacherBySchoolAndSubject.set(
        `${teacher.schoolId}:${teacher.subject}`,
        teacher.id
      );
    });

    const firstTeacherBySchool = new Map<number, number>();
    createdTeachers.forEach(teacher => {
      if (!firstTeacherBySchool.has(teacher.schoolId)) {
        firstTeacherBySchool.set(teacher.schoolId, teacher.id);
      }
    });

    const classTeacherValues: Array<{
      classSubjectId: number;
      teacherId: number;
    }> = [];
    for (const classSubjectRow of createdClassSubjects) {
      const classRow = classById.get(classSubjectRow.classId);
      const subjectRow = subjectById.get(classSubjectRow.subjectId);
      if (!classRow || !subjectRow) continue;

      const teacherId =
        teacherBySchoolAndSubject.get(
          `${classRow.schoolId}:${subjectRow.name}`
        ) ?? firstTeacherBySchool.get(classRow.schoolId);

      if (!teacherId) {
        throw new Error(
          `Teacher not found for school ${classRow.schoolId} and subject ${subjectRow.name}`
        );
      }

      classTeacherValues.push({
        classSubjectId: classSubjectRow.id,
        teacherId,
      });
    }

    const createdClassTeachers = await tx
      .insert(classTeachers)
      .values(classTeacherValues)
      .returning({
        classSubjectId: classTeachers.classSubjectId,
        teacherId: classTeachers.teacherId,
      });

    const classBySchoolAndGrade = new Map<string, number>();
    for (const classRow of createdClasses) {
      if (classRow.name === "6A") {
        classBySchoolAndGrade.set(`${classRow.schoolId}:6o Ano`, classRow.id);
      } else if (classRow.name === "7A") {
        classBySchoolAndGrade.set(`${classRow.schoolId}:7o Ano`, classRow.id);
      } else if (classRow.name === "8A") {
        classBySchoolAndGrade.set(`${classRow.schoolId}:8o Ano`, classRow.id);
      }
    }

    const classEnrollmentValues = createdStudents.map(student => {
      const grade = (student.grade ?? "7o Ano") as
        | "6o Ano"
        | "7o Ano"
        | "8o Ano";
      const classId = classBySchoolAndGrade.get(`${student.schoolId}:${grade}`);
      if (!classId) {
        throw new Error(
          `Class not found for school ${student.schoolId} and grade ${grade}`
        );
      }

      return {
        classId,
        studentId: student.id,
        enrollmentDate: `${year}-02-01`,
        status: "ativo" as const,
      };
    });

    const createdEnrollments = await tx
      .insert(classEnrollments)
      .values(classEnrollmentValues)
      .returning({
        classId: classEnrollments.classId,
        studentId: classEnrollments.studentId,
      });

    const teacherByClassSubject = new Map(
      createdClassTeachers.map(row => [row.classSubjectId, row.teacherId])
    );

    const classSubjectIdsByClassId = new Map<number, number[]>();
    createdClassSubjects.forEach(row => {
      const current = classSubjectIdsByClassId.get(row.classId) ?? [];
      current.push(row.id);
      classSubjectIdsByClassId.set(row.classId, current);
    });

    const classSessionValues = createdClassSubjects.map((row, index) => ({
      classSubjectId: row.id,
      teacherId: teacherByClassSubject.get(row.id) ?? null,
      lessonDate: `${year}-03-${String((index % 20) + 1).padStart(2, "0")}`,
      lessonNumber: 1,
      topic: `Aula introdutoria ${index + 1}`,
      notes: "Registro inicial de aula em ambiente demonstracao.",
    }));

    const createdSessions = await tx
      .insert(classSessions)
      .values(classSessionValues)
      .returning({
        id: classSessions.id,
        classSubjectId: classSessions.classSubjectId,
      });

    const sessionByClassSubject = new Map(
      createdSessions.map(row => [row.classSubjectId, row.id])
    );

    const attendanceValues: Array<{
      classSessionId: number;
      studentId: number;
      status: "present" | "absent" | "justified";
      reason: string | null;
      recordedByTeacherId: number | null;
    }> = [];

    createdEnrollments.forEach((enrollment, index) => {
      const classSubjectCandidates =
        classSubjectIdsByClassId.get(enrollment.classId) ?? [];
      const classSubjectId = classSubjectCandidates[0];
      if (!classSubjectId) return;

      const classSessionId = sessionByClassSubject.get(classSubjectId);
      if (!classSessionId) return;

      const recordedByTeacherId =
        teacherByClassSubject.get(classSubjectId) ?? null;
      const status: "present" | "absent" | "justified" =
        index % 11 === 0 ? "absent" : index % 7 === 0 ? "justified" : "present";

      attendanceValues.push({
        classSessionId,
        studentId: enrollment.studentId,
        status,
        reason: status === "justified" ? "Atestado medico" : null,
        recordedByTeacherId,
      });
    });

    await tx.insert(attendanceRecords).values(attendanceValues);

    const assessmentValues = createdClassSubjects.map((row, index) => ({
      classSubjectId: row.id,
      teacherId: teacherByClassSubject.get(row.id) ?? null,
      title: `Avaliacao ${index + 1}`,
      description: "Avaliacao formativa de acompanhamento.",
      maxScore: "10.00",
      weight: "1.00",
      assessmentDate: `${year}-04-${String((index % 20) + 1).padStart(2, "0")}`,
    }));

    const createdAssessments = await tx
      .insert(assessments)
      .values(assessmentValues)
      .returning({
        id: assessments.id,
        classSubjectId: assessments.classSubjectId,
      });

    const assessmentByClassSubject = new Map(
      createdAssessments.map(row => [row.classSubjectId, row.id])
    );

    const scoreValues: Array<{
      assessmentId: number;
      studentId: number;
      score: string;
      feedback: string;
    }> = [];

    createdEnrollments.forEach((enrollment, index) => {
      const classSubjectCandidates =
        classSubjectIdsByClassId.get(enrollment.classId) ?? [];
      const classSubjectId = classSubjectCandidates[0];
      if (!classSubjectId) return;
      const assessmentId = assessmentByClassSubject.get(classSubjectId);
      if (!assessmentId) return;

      const scoreBase = 6.5 + (index % 7) * 0.5;
      scoreValues.push({
        assessmentId,
        studentId: enrollment.studentId,
        score: Math.min(10, scoreBase).toFixed(2),
        feedback:
          scoreBase >= 8 ? "Bom desempenho" : "Precisa reforcar alguns topicos",
      });
    });

    await tx.insert(assessmentScores).values(scoreValues);

    const teacherIdBySchool = new Map<number, number[]>();
    createdTeachers.forEach(teacher => {
      const current = teacherIdBySchool.get(teacher.schoolId) ?? [];
      current.push(teacher.id);
      teacherIdBySchool.set(teacher.schoolId, current);
    });

    const classSubjectByClass = new Map<number, number[]>();
    createdClassSubjects.forEach(row => {
      const current = classSubjectByClass.get(row.classId) ?? [];
      current.push(row.id);
      classSubjectByClass.set(row.classId, current);
    });

    const studentCommentValues = createdStudents
      .slice(0, 12)
      .map((student, index) => {
        const schoolTeachers = teacherIdBySchool.get(student.schoolId) ?? [];
        const teacherId = schoolTeachers[index % schoolTeachers.length] ?? null;
        const classId = classBySchoolAndGrade.get(
          `${student.schoolId}:${student.grade ?? "7o Ano"}`
        );
        const classSubjectId = classId
          ? ((classSubjectByClass.get(classId) ?? [])[0] ?? null)
          : null;

        return {
          schoolId: student.schoolId,
          studentId: student.id,
          teacherId,
          classSubjectId,
          category:
            index % 3 === 0
              ? ("elogio" as const)
              : index % 3 === 1
                ? ("melhoria" as const)
                : ("comentario" as const),
          visibility:
            index % 2 === 0 ? ("all" as const) : ("guardian" as const),
          content:
            index % 2 === 0
              ? "Aluno com participacao consistente e boa evolucao."
              : "Recomenda-se revisar tarefas da semana para consolidar aprendizagem.",
        };
      });

    await tx.insert(studentComments).values(studentCommentValues);

    const schoolAdminBySchoolId = new Map<number, number>();
    schoolAccountSeeds.forEach(seed => {
      if (seed.schoolRole !== "admin") return;
      schoolAdminBySchoolId.set(
        requireSchoolId(seed.schoolSlug),
        requireUserId(seed.email)
      );
    });

    const eventValues = createdSchools.map((school, index) => ({
      schoolId: school.id,
      title: index % 2 === 0 ? "Feira Pedagogica" : "Semana Cultural",
      description: "Evento institucional com atividades de integracao.",
      eventType: "evento_escolar" as const,
      startsAt: new Date(
        `${year}-05-${String(10 + index).padStart(2, "0")}T13:00:00.000Z`
      ),
      endsAt: new Date(
        `${year}-05-${String(10 + index).padStart(2, "0")}T17:00:00.000Z`
      ),
      createdByUserId: schoolAdminBySchoolId.get(school.id) ?? null,
    }));

    const createdEvents = await tx
      .insert(schoolEvents)
      .values(eventValues)
      .returning({ id: schoolEvents.id, schoolId: schoolEvents.schoolId });

    const eventTargetValues = createdEvents.flatMap(event =>
      createdClasses
        .filter(classRow => classRow.schoolId === event.schoolId)
        .map(classRow => ({
          eventId: event.id,
          targetType: "class" as const,
          targetRefId: classRow.id,
        }))
    );

    await tx.insert(eventTargets).values(eventTargetValues);

    const communicationValues = createdSchools.map((school, index) => {
      const event = createdEvents.find(item => item.schoolId === school.id);
      return {
        schoolId: school.id,
        authorUserId: schoolAdminBySchoolId.get(school.id) ?? null,
        title: index % 2 === 0 ? "Comunicado geral" : "Lembrete de reuniao",
        body: "Comunicado enviado automaticamente pelo seed de demonstracao.",
        communicationType:
          index % 2 === 0 ? ("announcement" as const) : ("reminder" as const),
        relatedEventId: event?.id ?? null,
      };
    });

    const createdCommunications = await tx
      .insert(communications)
      .values(communicationValues)
      .returning({ id: communications.id, schoolId: communications.schoolId });

    const guardiansBySchoolId = new Map<number, number[]>();
    createdGuardians.forEach(guardian => {
      const current = guardiansBySchoolId.get(guardian.schoolId) ?? [];
      current.push(guardian.id);
      guardiansBySchoolId.set(guardian.schoolId, current);
    });

    const communicationRecipientValues = createdCommunications.flatMap(
      communication => {
        const schoolGuardians =
          guardiansBySchoolId.get(communication.schoolId) ?? [];
        return schoolGuardians.slice(0, 12).map(guardianId => ({
          communicationId: communication.id,
          recipientType: "guardian" as const,
          recipientRefId: guardianId,
        }));
      }
    );

    await tx
      .insert(communicationRecipients)
      .values(communicationRecipientValues);

    const attachmentValues = createdCommunications.map(
      (communication, index) => ({
        ownerType: "communication" as const,
        ownerId: communication.id,
        fileUrl: `${FAKE_ATTACHMENT_URL_PREFIX}boletins/comunicado-${index + 1}.pdf`,
        fileName: `comunicado-${index + 1}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 102400 + index * 512,
      })
    );

    await tx.insert(attachments).values(attachmentValues);

    const notificationValues = [
      ...studentSeeds.map(seed => ({
        userId: requireUserId(seed.email),
        notificationType: "grade_published" as const,
        title: "Nova avaliacao disponivel",
        body: "Uma avaliacao foi publicada no seu painel.",
        actionUrl: "/dashboard?profile=student",
      })),
      ...teacherSeeds.map(seed => ({
        userId: requireUserId(seed.email),
        notificationType: "general" as const,
        title: "Planejamento semanal",
        body: "Atualize o plano de aula ate sexta-feira.",
        actionUrl: "/dashboard?profile=teacher",
      })),
      ...guardianSeeds.slice(0, 20).map(seed => ({
        userId: requireUserId(seed.email),
        notificationType: "event_reminder" as const,
        title: "Lembrete de evento",
        body: "Ha um evento escolar programado para esta semana.",
        actionUrl: "/dashboard?profile=guardian",
      })),
    ];

    await tx.insert(notifications).values(notificationValues);

    await tx.insert(contacts).values(
      createdSchools.map((school, index) => ({
        schoolId: school.id,
        name: `Contato Demo ${index + 1}`,
        email: `contato.demo.${index + 1}@${FAKE_DOMAIN}`,
        school: school.name,
        role: "responsavel",
        students: "2",
        message: "Solicitacao de informacoes enviada por seed automatizado.",
        status: "novo" as const,
      }))
    );

    return {
      schoolIds: createdSchools.map(row => row.id),
      userEmails: userSeeds.map(seed => seed.email),
      studentNames: studentSeeds.map(seed => seed.name),
      totals: {
        schools: schoolSeeds.length,
        teachers: teacherSeeds.length,
        students: studentSeeds.length,
        guardians: guardianSeeds.length,
      },
      credentialsByCategory: buildCredentialsByCategory(
        userSeeds,
        categoryPasswords
      ),
      removedSupabaseAuthUsersOnReset: resetInfo.removedSupabaseAuthUsers,
    };
  });
}

export const fakeSeedMeta = {
  domain: FAKE_DOMAIN,
  openIdPrefix: FAKE_OPEN_ID_PREFIX,
  schoolNamePrefix: FAKE_SCHOOL_NAME_PREFIX,
  supabaseMarker: FAKE_SUPABASE_MARKER,
  categories: CATEGORY_LABELS,
};
