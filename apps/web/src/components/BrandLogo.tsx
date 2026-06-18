import { useTheme } from "@/contexts/ThemeContext";
import type { MouseEvent } from "react";

type BrandLogoProps = {
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  size?: "compact" | "regular";
};

export default function BrandLogo({
  href = "/",
  onClick,
  className = "",
  size = "regular",
}: BrandLogoProps) {
  const isCompact = size === "compact";
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/logo-white.svg" : "/logo-black.svg";

  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-3 group ${className}`}
    >
      <img
        src={logoSrc}
        alt=""
        className={`object-contain transition-all duration-200 group-hover:scale-105 ${
          isCompact
            ? "h-[clamp(2.25rem,3.2vw,2.75rem)] w-auto"
            : "h-[clamp(2.9rem,4vw,3.5rem)] w-auto"
        }`}
      />
    </a>
  );
}
