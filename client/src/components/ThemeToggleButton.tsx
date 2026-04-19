import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

type ThemeToggleButtonProps = {
  compact?: boolean;
  floating?: boolean;
};

export default function ThemeToggleButton({
  compact = false,
  floating = false,
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={isDark}
      className={[
        floating
          ? "inline-flex items-center justify-center rounded-full bg-transparent text-theme-primary"
          : "inline-flex items-center justify-center rounded-lg border border-theme-soft bg-theme-elevated text-theme-primary shadow-sm",
        "hover:bg-theme-muted hover:text-red-brand transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-brand/60",
        compact ? (floating ? "h-10 w-10" : "h-9 w-9") : "h-10 w-10",
      ].join(" ")}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <span className="sr-only">Alternar tema</span>
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
