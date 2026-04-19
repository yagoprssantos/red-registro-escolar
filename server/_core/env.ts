const isProduction = process.env.NODE_ENV === "production";
const rawJwtSecret = process.env.JWT_SECRET?.trim() ?? "";
const rawAppId = process.env.VITE_APP_ID?.trim() ?? "";

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

export const ENV = {
  appId,
  cookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
