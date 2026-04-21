const isProduction = process.env.NODE_ENV === "production";
const rawJwtSecret = process.env.JWT_SECRET?.trim() ?? "";
const rawAppId = process.env.VITE_APP_ID?.trim() ?? "";
const rawSupabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
const rawSupabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
const rawSupabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

if (isProduction && !rawJwtSecret) {
  throw new Error(
    "JWT_SECRET is required in production for secure session signing."
  );
}

const cookieSecret = rawJwtSecret || "red-dev-jwt-secret-local-only-change-me";
const appId = rawAppId || "red-local-app";

if (!isProduction && !rawJwtSecret) {
  console.warn(
    "[Auth] JWT_SECRET is not configured. Using development fallback secret."
  );
}

if (!isProduction && !rawAppId) {
  console.warn(
    "[Auth] VITE_APP_ID is not configured. Using development fallback appId."
  );
}

if (!isProduction && (!rawSupabaseUrl || !rawSupabaseAnonKey)) {
  console.warn(
    "[Auth] SUPABASE_URL or SUPABASE_ANON_KEY is not configured. Email/password and Supabase OAuth flows will be unavailable."
  );
}

const bootstrapDefaultAdmins =
  (process.env.AUTH_BOOTSTRAP_DEFAULT_ADMINS ?? "false").toLowerCase() ===
  "true";

const defaultAdminPassword = process.env.AUTH_DEFAULT_ADMIN_PASSWORD ?? "";

export const ENV = {
  appId,
  cookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: rawSupabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
  supabaseServiceRoleKey: rawSupabaseServiceRoleKey,
  bootstrapDefaultAdmins,
  defaultAdminPassword,
  defaultAdminSchoolName:
    process.env.AUTH_DEFAULT_SCHOOL_NAME?.trim() || "Escola RED Referencia",
  defaultAdminSchoolInstitutionEmail:
    process.env.AUTH_DEFAULT_SCHOOL_INSTITUTION_EMAIL?.trim() ||
    "contato@escola-red-referencia.edu.br",
  defaultSchoolAdminEmail:
    process.env.AUTH_DEFAULT_SCHOOL_ADMIN_EMAIL?.trim() ||
    "admin.escola@red.local",
  defaultTeacherAdminEmail:
    process.env.AUTH_DEFAULT_TEACHER_ADMIN_EMAIL?.trim() ||
    "admin.professor@red.local",
  defaultStudentAdminEmail:
    process.env.AUTH_DEFAULT_STUDENT_ADMIN_EMAIL?.trim() ||
    "admin.aluno@red.local",
  defaultGuardianAdminEmail:
    process.env.AUTH_DEFAULT_GUARDIAN_ADMIN_EMAIL?.trim() ||
    "admin.responsavel@red.local",
};
