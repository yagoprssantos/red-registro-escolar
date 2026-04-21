export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Resolve login URL inside the app.
export const getLoginUrl = (returnPath?: string) => {
  const url = new URL("/login", window.location.origin);

  if (returnPath) {
    url.searchParams.set("returnPath", returnPath);
  }

  return `${url.pathname}${url.search}`;
};
