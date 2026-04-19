export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Keep local development resilient when OAuth env vars are not configured.
  if (!oauthPortalUrl || !appId) {
    const fallback = new URL("/login", window.location.origin);
    if (returnPath) {
      fallback.searchParams.set("returnPath", returnPath);
    }
    return fallback.toString();
  }

  const state = btoa(
    returnPath
      ? `${redirectUri}?returnPath=${encodeURIComponent(returnPath)}`
      : redirectUri
  );

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

