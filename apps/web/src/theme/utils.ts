import { THEME_STORAGE_KEY, type Theme } from "./constants";

const isTheme = (value: string | null): value is Theme => {
  return value === "light" || value === "dark";
};

export const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : null;
};

export const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const resolveInitialTheme = (defaultTheme: Theme): Theme => {
  const stored = getStoredTheme();
  return stored ?? getSystemTheme() ?? defaultTheme;
};

export const persistTheme = (theme: Theme) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};
