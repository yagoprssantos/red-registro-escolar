import type { Express, Request, Response } from "express";
import {
  COOKIE_NAME,
  ONE_YEAR_MS,
} from "../../../../packages/shared/src/const.ts";
import {
  createGuardianProfile,
  createSchool,
  createSchoolStaffProfile,
  createStudentProfile,
  createTeacherProfile,
  createUserSchool,
  getSchoolByEmail,
  getUserByOpenId,
  linkStudentGuardian,
  listEntityRows,
  upsertUser,
} from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

type UserProfile = "school" | "teacher" | "student" | "guardian";
type OAuthProvider = "google" | "github" | "azure" | "apple";

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

type SupabasePasswordSignInResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user?: SupabaseAuthUser | null;
};

type DefaultSeedAccount = {
  profile: UserProfile;
  email: string;
  name: string;
};

const allowedProviders = new Set<OAuthProvider>([
  "google",
  "github",
  "azure",
  "apple",
]);

const profileToIdentity = {
  school: {
    role: "school_staff" as const,
    defaultProfile: "school" as const,
    userSchoolRole: "admin" as const,
  },
  teacher: {
    role: "teacher" as const,
    defaultProfile: "teacher" as const,
    userSchoolRole: "teacher" as const,
  },
  student: {
    role: "student" as const,
    defaultProfile: "student" as const,
    userSchoolRole: "student" as const,
  },
  guardian: {
    role: "guardian" as const,
    defaultProfile: "guardian" as const,
    userSchoolRole: "guardian" as const,
  },
} as const;

class SupabaseAuthError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "SupabaseAuthError";
    this.status = status;
    this.payload = payload;
  }
}

function isUserProfile(value: unknown): value is UserProfile {
  return (
    value === "school" ||
    value === "teacher" ||
    value === "student" ||
    value === "guardian"
  );
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getBodyString(req: Request, key: string): string | undefined {
  const value = (req.body as Record<string, unknown> | undefined)?.[key];
  return typeof value === "string" ? value : undefined;
}

function parseSafeReturnPath(input: string | undefined): string | null {
  if (!input) return null;
  if (!input.startsWith("/")) return null;
  if (input.startsWith("//")) return null;
  return input;
}

function getRequestOrigin(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];

  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]?.trim() || req.protocol
      : req.protocol;

  const host =
    typeof forwardedHost === "string"
      ? forwardedHost.split(",")[0]?.trim()
      : req.get("host") || "localhost:3000";

  return `${protocol || "http"}://${host}`;
}

function resolveRequestedProfile(
  input: string | undefined
): UserProfile | null {
  if (!input) return null;
  return isUserProfile(input) ? input : null;
}

function resolveProfileAwareReturnPath(
  requestedPath: string | undefined,
  profile: UserProfile
): string {
  const safePath = parseSafeReturnPath(requestedPath);
  const fallbackPath = `/dashboard?profile=${profile}`;

  if (!safePath) {
    return fallbackPath;
  }

  const url = new URL(safePath, "http://localhost");
  url.searchParams.set("profile", profile);

  return `${url.pathname}${url.search}`;
}

function hasSupabaseAuthConfig() {
  return Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);
}

function normalizeSupabaseBaseUrl() {
  return ENV.supabaseUrl.replace(/\/$/, "");
}

function getSupabaseAuthHeaders(
  options: { accessToken?: string; useServiceRole?: boolean } = {}
) {
  const apiKey = options.useServiceRole
    ? ENV.supabaseServiceRoleKey
    : ENV.supabaseAnonKey;

  if (!apiKey) {
    throw new Error("Missing Supabase API key for auth request");
  }

  const headers: Record<string, string> = {
    apikey: apiKey,
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  } else if (options.useServiceRole) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
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

async function supabaseRequest<T>(
  path: string,
  init: RequestInit,
  options: { accessToken?: string; useServiceRole?: boolean } = {}
): Promise<T> {
  if (!hasSupabaseAuthConfig()) {
    throw new Error("Supabase Auth is not configured");
  }

  const response = await fetch(`${normalizeSupabaseBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...getSupabaseAuthHeaders(options),
      ...(init.headers ?? {}),
    },
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new SupabaseAuthError(
      `Supabase request failed: ${path}`,
      response.status,
      payload
    );
  }

  return payload as T;
}

async function signInWithPassword(
  email: string,
  password: string
): Promise<SupabasePasswordSignInResponse> {
  return await supabaseRequest<SupabasePasswordSignInResponse>(
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
}

async function signUpWithPassword(
  email: string,
  password: string,
  metadata: Record<string, unknown>
) {
  return await supabaseRequest<{ user?: SupabaseAuthUser | null }>(
    "/auth/v1/signup",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        data: metadata,
      }),
    }
  );
}

async function getSupabaseUserByAccessToken(
  accessToken: string
): Promise<SupabaseAuthUser> {
  return await supabaseRequest<SupabaseAuthUser>(
    "/auth/v1/user",
    {
      method: "GET",
    },
    {
      accessToken,
    }
  );
}

async function createSupabaseUserWithServiceRole(
  email: string,
  password: string,
  metadata: Record<string, unknown>
) {
  return await supabaseRequest<SupabaseAuthUser>(
    "/auth/v1/admin/users",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      }),
    },
    {
      useServiceRole: true,
    }
  );
}

function extractProfileFromMetadata(
  user: SupabaseAuthUser
): UserProfile | null {
  const userMetadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};

  const candidates = [
    userMetadata.defaultProfile,
    userMetadata.profile,
    appMetadata.defaultProfile,
    appMetadata.profile,
  ];

  for (const candidate of candidates) {
    if (isUserProfile(candidate)) return candidate;
  }

  return null;
}

function extractDisplayName(user: SupabaseAuthUser): string {
  const userMetadata = user.user_metadata ?? {};
  const displayName =
    (typeof userMetadata.full_name === "string" && userMetadata.full_name) ||
    (typeof userMetadata.name === "string" && userMetadata.name) ||
    user.email ||
    "Usuario RED";

  return displayName;
}

async function syncLocalUserFromSupabaseUser(options: {
  supabaseUser: SupabaseAuthUser;
  requestedProfile: UserProfile | null;
  loginMethod: string;
}) {
  const { supabaseUser, requestedProfile, loginMethod } = options;

  const openId = `supabase:${supabaseUser.id}`;
  const existingLocalUser = await getUserByOpenId(openId);
  const metadataProfile = extractProfileFromMetadata(supabaseUser);

  const resolvedProfile = isUserProfile(existingLocalUser?.defaultProfile)
    ? existingLocalUser.defaultProfile
    : (requestedProfile ?? metadataProfile ?? "school");

  const identity = profileToIdentity[resolvedProfile];
  const role =
    existingLocalUser && existingLocalUser.role !== "user"
      ? existingLocalUser.role
      : identity.role;

  const defaultProfile = isUserProfile(existingLocalUser?.defaultProfile)
    ? existingLocalUser.defaultProfile
    : identity.defaultProfile;

  await upsertUser({
    openId,
    name: extractDisplayName(supabaseUser),
    email: supabaseUser.email ?? existingLocalUser?.email ?? null,
    loginMethod,
    role,
    defaultProfile,
    lastSignedIn: new Date(),
  });

  const localUser = await getUserByOpenId(openId);
  if (!localUser) {
    throw new Error("Failed to persist authenticated user");
  }

  const enforcedProfile = isUserProfile(localUser.defaultProfile)
    ? localUser.defaultProfile
    : resolvedProfile;

  return {
    localUser,
    enforcedProfile,
  };
}

async function issueAppSession(
  req: Request,
  res: Response,
  options: {
    openId: string;
    name: string;
  }
) {
  const sessionToken = await sdk.createSessionToken(options.openId, {
    name: options.name,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });
}

async function ensureSchoolContextForSeed(options: {
  localUserId: number;
  schoolId: number;
  seed: DefaultSeedAccount;
  schoolName: string;
}) {
  const { localUserId, schoolId, seed, schoolName } = options;
  const identity = profileToIdentity[seed.profile];

  await createUserSchool({
    userId: localUserId,
    schoolId,
    role: identity.userSchoolRole,
  });

  if (seed.profile === "school") {
    const staffRows = await listEntityRows("schoolStaffProfiles", {
      filters: {
        userId: localUserId,
        schoolId,
        role: "admin",
      },
      limit: 1,
      offset: 0,
    });

    if (staffRows.length === 0) {
      await createSchoolStaffProfile({
        userId: localUserId,
        schoolId,
        role: "admin",
        positionTitle: "Administrador",
      });
    }

    return;
  }

  if (seed.profile === "teacher") {
    const teachers = await listEntityRows("teachers", {
      filters: { userId: localUserId, schoolId },
      limit: 1,
      offset: 0,
    });

    if (teachers.length === 0) {
      await createTeacherProfile({
        userId: localUserId,
        schoolId,
        name: seed.name,
        email: seed.email,
        subject: "Gestao Pedagogica",
      });
    }

    return;
  }

  if (seed.profile === "student") {
    const students = await listEntityRows("students", {
      filters: { userId: localUserId, schoolId },
      limit: 1,
      offset: 0,
    });

    if (students.length === 0) {
      await createStudentProfile({
        userId: localUserId,
        schoolId,
        name: seed.name,
        email: seed.email,
        grade: "9o Ano",
      });
    }

    return;
  }

  const guardians = await listEntityRows("guardians", {
    filters: { userId: localUserId, schoolId },
    limit: 1,
    offset: 0,
  });

  if (guardians.length === 0) {
    await createGuardianProfile({
      userId: localUserId,
      schoolId,
      name: seed.name,
      email: seed.email,
      relationship: "Responsavel legal",
    });
  }

  const seededStudent = await listEntityRows("students", {
    filters: { schoolId },
    limit: 1,
    offset: 0,
  });

  const seededGuardian = await listEntityRows("guardians", {
    filters: { userId: localUserId, schoolId },
    limit: 1,
    offset: 0,
  });

  const studentId = toNumber((seededStudent[0] as Record<string, unknown>)?.id);
  const guardianId = toNumber(
    (seededGuardian[0] as Record<string, unknown>)?.id
  );

  if (!studentId || !guardianId) {
    return;
  }

  const links = await listEntityRows("studentGuardians", {
    filters: { studentId, guardianId },
    limit: 1,
    offset: 0,
  });

  if (links.length === 0) {
    await linkStudentGuardian({
      studentId,
      guardianId,
      relationship: `Responsavel de ${schoolName}`,
      isPrimary: 1,
    });
  }
}

async function ensureSupabaseAccountForSeed(
  seed: DefaultSeedAccount,
  password: string
): Promise<SupabaseAuthUser | null> {
  const metadata = {
    full_name: seed.name,
    defaultProfile: seed.profile,
    profile: seed.profile,
  };

  try {
    const signInResponse = await signInWithPassword(seed.email, password);
    if (signInResponse.user?.id) {
      return signInResponse.user;
    }
  } catch {
    // continue to provisioning attempt
  }

  if (ENV.supabaseServiceRoleKey) {
    try {
      await createSupabaseUserWithServiceRole(seed.email, password, metadata);
    } catch (error) {
      if (!(error instanceof SupabaseAuthError) || error.status !== 422) {
        console.warn(
          `[Auth] Failed to create seed account ${seed.email} with service role`,
          error
        );
      }
    }
  } else {
    try {
      await signUpWithPassword(seed.email, password, metadata);
    } catch (error) {
      if (!(error instanceof SupabaseAuthError) || error.status !== 422) {
        console.warn(
          `[Auth] Failed to sign up seed account ${seed.email}`,
          error
        );
      }
    }
  }

  try {
    const signInResponse = await signInWithPassword(seed.email, password);
    return signInResponse.user ?? null;
  } catch (error) {
    console.warn(
      `[Auth] Could not authenticate seeded account ${seed.email}. Verify AUTH_DEFAULT_ADMIN_PASSWORD and Supabase email confirmation policy.`,
      error
    );
    return null;
  }
}

async function bootstrapDefaultAdminAccounts() {
  if (!ENV.bootstrapDefaultAdmins) {
    return;
  }

  if (!hasSupabaseAuthConfig()) {
    console.warn(
      "[Auth] AUTH_BOOTSTRAP_DEFAULT_ADMINS is enabled, but Supabase Auth is not configured."
    );
    return;
  }

  const seedPassword = ENV.defaultAdminPassword.trim();
  if (!seedPassword) {
    console.warn(
      "[Auth] AUTH_BOOTSTRAP_DEFAULT_ADMINS is enabled, but AUTH_DEFAULT_ADMIN_PASSWORD is empty."
    );
    return;
  }

  const existingSchool = await getSchoolByEmail(
    ENV.defaultAdminSchoolInstitutionEmail
  );

  const school =
    existingSchool ??
    (await createSchool({
      name: ENV.defaultAdminSchoolName,
      email: ENV.defaultAdminSchoolInstitutionEmail,
      status: "ativo",
    }));

  if (!school) {
    console.warn(
      "[Auth] Unable to create or load default school for seeded admins"
    );
    return;
  }

  const seeds: DefaultSeedAccount[] = [
    {
      profile: "school",
      email: ENV.defaultSchoolAdminEmail,
      name: "Admin Escola RED",
    },
    {
      profile: "teacher",
      email: ENV.defaultTeacherAdminEmail,
      name: "Admin Professor RED",
    },
    {
      profile: "student",
      email: ENV.defaultStudentAdminEmail,
      name: "Admin Aluno RED",
    },
    {
      profile: "guardian",
      email: ENV.defaultGuardianAdminEmail,
      name: "Admin Responsavel RED",
    },
  ];

  for (const seed of seeds) {
    if (!seed.email) {
      continue;
    }

    const supabaseUser = await ensureSupabaseAccountForSeed(seed, seedPassword);
    if (!supabaseUser?.id) {
      continue;
    }

    const { localUser } = await syncLocalUserFromSupabaseUser({
      supabaseUser,
      requestedProfile: seed.profile,
      loginMethod: "supabase-password",
    });

    await ensureSchoolContextForSeed({
      localUserId: localUser.id,
      schoolId: school.id,
      seed,
      schoolName: school.name,
    });
  }

  console.log("[Auth] Default profile admin bootstrap finished");
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    if (!hasSupabaseAuthConfig()) {
      res.status(503).json({
        error:
          "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
      });
      return;
    }

    const email = getBodyString(req, "email")?.trim().toLowerCase();
    const password = getBodyString(req, "password") ?? "";
    const requestedProfile = resolveRequestedProfile(
      getBodyString(req, "profile")
    );
    const requestedReturnPath = getBodyString(req, "returnPath");

    if (!email || !password) {
      res.status(400).json({
        error: "Email and password are required",
      });
      return;
    }

    try {
      const signInResponse = await signInWithPassword(email, password);
      const supabaseUser =
        signInResponse.user ??
        (await getSupabaseUserByAccessToken(signInResponse.access_token));

      if (!supabaseUser?.id) {
        res.status(401).json({
          error: "Unable to resolve authenticated user",
        });
        return;
      }

      const { localUser, enforcedProfile } =
        await syncLocalUserFromSupabaseUser({
          supabaseUser,
          requestedProfile,
          loginMethod: "supabase-password",
        });

      await issueAppSession(req, res, {
        openId: localUser.openId,
        name: localUser.name ?? supabaseUser.email ?? "Usuario RED",
      });

      res.status(200).json({
        success: true,
        redirectTo: resolveProfileAwareReturnPath(
          requestedReturnPath,
          enforcedProfile
        ),
      });
    } catch (error) {
      if (error instanceof SupabaseAuthError) {
        const status = error.status === 400 || error.status === 401 ? 401 : 502;
        res.status(status).json({
          error: "Invalid credentials or auth provider unavailable",
        });
        return;
      }

      console.error("[Auth] Password login failed", error);
      res.status(500).json({ error: "Password login failed" });
    }
  });

  app.post(
    "/api/auth/supabase/session",
    async (req: Request, res: Response) => {
      if (!hasSupabaseAuthConfig()) {
        res.status(503).json({
          error:
            "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
        });
        return;
      }

      const accessToken = getBodyString(req, "accessToken");
      const requestedProfile = resolveRequestedProfile(
        getBodyString(req, "profile")
      );
      const requestedReturnPath = getBodyString(req, "returnPath");

      if (!accessToken) {
        res.status(400).json({ error: "accessToken is required" });
        return;
      }

      try {
        const supabaseUser = await getSupabaseUserByAccessToken(accessToken);
        if (!supabaseUser?.id) {
          res
            .status(401)
            .json({ error: "Unable to resolve authenticated user" });
          return;
        }

        const { localUser, enforcedProfile } =
          await syncLocalUserFromSupabaseUser({
            supabaseUser,
            requestedProfile,
            loginMethod: "supabase-oauth",
          });

        await issueAppSession(req, res, {
          openId: localUser.openId,
          name: localUser.name ?? supabaseUser.email ?? "Usuario RED",
        });

        res.status(200).json({
          success: true,
          redirectTo: resolveProfileAwareReturnPath(
            requestedReturnPath,
            enforcedProfile
          ),
        });
      } catch (error) {
        if (error instanceof SupabaseAuthError) {
          const status =
            error.status === 400 || error.status === 401 ? 401 : 502;
          res.status(status).json({
            error: "Supabase OAuth session validation failed",
          });
          return;
        }

        console.error("[Auth] Supabase session finalization failed", error);
        res.status(500).json({ error: "Unable to finalize Supabase session" });
      }
    }
  );

  app.get("/api/auth/oauth/start", async (req: Request, res: Response) => {
    if (!hasSupabaseAuthConfig()) {
      res.status(503).json({
        error:
          "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
      });
      return;
    }

    const provider = getQueryParam(req, "provider");
    const requestedProfile =
      resolveRequestedProfile(getQueryParam(req, "profile")) ?? "school";
    const requestedReturnPath = getQueryParam(req, "returnPath");

    if (!provider || !allowedProviders.has(provider as OAuthProvider)) {
      res.status(400).json({
        error: "Unsupported OAuth provider",
      });
      return;
    }

    const profileAwareReturnPath = resolveProfileAwareReturnPath(
      requestedReturnPath,
      requestedProfile
    );

    const redirectTo = new URL("/login", getRequestOrigin(req));
    redirectTo.searchParams.set("profile", requestedProfile);
    redirectTo.searchParams.set("returnPath", profileAwareReturnPath);

    const authUrl = new URL("/auth/v1/authorize", normalizeSupabaseBaseUrl());
    authUrl.searchParams.set("provider", provider);
    authUrl.searchParams.set("redirect_to", redirectTo.toString());

    res.redirect(302, authUrl.toString());
  });

  // Backward compatibility route for previous OAuth callback URLs.
  app.get("/api/oauth/callback", (req: Request, res: Response) => {
    const requestedProfile =
      resolveRequestedProfile(getQueryParam(req, "profile")) ?? "school";
    const requestedReturnPath = getQueryParam(req, "returnPath");
    const profileAwareReturnPath = resolveProfileAwareReturnPath(
      requestedReturnPath,
      requestedProfile
    );

    const loginUrl = new URL("/login", getRequestOrigin(req));
    loginUrl.searchParams.set("profile", requestedProfile);
    loginUrl.searchParams.set("returnPath", profileAwareReturnPath);

    res.redirect(302, `${loginUrl.pathname}${loginUrl.search}`);
  });

  void bootstrapDefaultAdminAccounts().catch(error => {
    console.error("[Auth] Default admin bootstrap failed", error);
  });
}
