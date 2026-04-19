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
          isCompact ? "h-10 w-10 rounded-xl" : "h-14 w-14 rounded-2xl"
        }`}
      >
        <span
          className={`font-condensed font-bold tracking-[0.2em] ${
            isCompact ? "text-lg" : "text-xl"
          }`}
        >
          R
        </span>
      </div>
      <div className="leading-none text-left">
        <p
          className={`font-condensed font-bold tracking-[0.25em] text-red-brand uppercase ${
            isCompact ? "text-xl" : "text-2xl"
          }`}
        >
          RED
        </p>
        <p className="font-body text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          Registro Escolar Digital
        </p>
      </div>
    </a>
  );
}
