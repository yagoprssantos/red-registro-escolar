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
            ? "h-[clamp(2.25rem,3.2vw,2.75rem)] w-[clamp(2.25rem,3.2vw,2.75rem)] rounded-lg"
            : "h-[clamp(2.9rem,4vw,3.5rem)] w-[clamp(2.9rem,4vw,3.5rem)] rounded-xl"
        }`}
      >
        <span
          className={`font-condensed font-bold tracking-[0.2em] ${
            isCompact
              ? "text-[clamp(1rem,1.3vw,1.1rem)]"
              : "text-[clamp(1.1rem,1.5vw,1.25rem)]"
          }`}
        >
          R
        </span>
      </div>
      <div className="leading-none text-left">
        <p
          className={`font-condensed font-bold tracking-[0.25em] text-red-brand uppercase ${
            isCompact
              ? "text-[clamp(1.05rem,1.5vw,1.25rem)]"
              : "text-[clamp(1.25rem,1.8vw,1.55rem)]"
          }`}
        >
          RED
        </p>
        <p
          className={`font-body text-[11px] uppercase tracking-[0.24em] text-muted-foreground ${
            isCompact
              ? "hidden sm:block text-[clamp(0.65rem,0.75vw,0.72rem)]"
              : "block"
          }`}
        >
          Registro Escolar Digital
        </p>
      </div>
    </a>
  );
}
