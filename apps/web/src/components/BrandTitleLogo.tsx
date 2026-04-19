import type { MouseEvent } from "react";

type BrandTitleLogoProps = {
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  size?: "compact" | "regular";
};

export default function BrandTitleLogo({
  href = "/",
  onClick,
  className = "",
  size = "regular",
}: BrandTitleLogoProps) {
  const isCompact = size === "compact";

  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-3 group ${className}`}
    >
      <div
        className={`flex items-center justify-center bg-red-brand text-white shadow-lg shadow-red-brand/20 transition-transform group-hover:scale-105 ${
          isCompact
            ? "h-9 w-9 rounded-lg sm:h-10 sm:w-10 sm:rounded-xl"
            : "h-12 w-12 rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl"
        }`}
      >
        <span
          className={`font-condensed font-bold tracking-[0.2em] ${
            isCompact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
          }`}
        >
          R
        </span>
      </div>
      <div className="leading-none text-left">
        <p
          className={`font-condensed font-bold tracking-[0.25em] text-red-brand uppercase ${
            isCompact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          }`}
        >
          RED
        </p>
        <p
          className={`font-body text-[11px] uppercase tracking-[0.24em] text-muted-foreground ${
            isCompact ? "hidden sm:block" : "block"
          }`}
        >
          Registro Escolar Digital
        </p>
      </div>
    </a>
  );
}
