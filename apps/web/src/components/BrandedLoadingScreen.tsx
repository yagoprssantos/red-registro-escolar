import BrandTitleLogo from "@/components/BrandTitleLogo";
import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";

type BrandedLoadingScreenProps = {
  title: string;
  subtitle?: string;
  detail?: string;
  fullscreen?: boolean;
  className?: string;
};

export function BrandedLoadingScreen({
  title,
  subtitle,
  detail = "Preparando ambiente",
  fullscreen = true,
  className = "",
}: BrandedLoadingScreenProps) {
  return (
    <div
      className={`relative overflow-hidden bg-background text-foreground ${
        fullscreen ? "min-h-screen" : "h-full min-h-[22rem]"
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.16),transparent_32%),linear-gradient(135deg,var(--background),var(--muted))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(139,17,32,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(31,58,95,0.05)_1px,transparent_1px)] bg-[size:68px_68px] opacity-70" />
      <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-condensed text-[clamp(4rem,15vw,9rem)] font-bold tracking-[0.32em] text-foreground/5">
        RED
      </p>

      <div className="relative z-10 flex min-h-inherit items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-xl rounded-[2rem] border border-border/70 bg-card/80 p-7 text-center shadow-[0_24px_80px_-32px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-10"
        >
          <div className="flex justify-center">
            <BrandTitleLogo size="compact" className="pointer-events-none" />
          </div>

          <h1 className="mt-7 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-heading font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1.15, ease: "linear", repeat: Infinity }}
            >
              <LoaderCircle size={14} />
            </motion.span>
            <span>{detail}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
