/*
 * ProfileSelector — RED Registro Escolar Digital
 * Porta de entrada da plataforma com escolha de perfil específica
 */

import BrandTitleLogo from "@/components/BrandTitleLogo";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import { setPageMeta } from "@/lib/pageMeta";
import {
  buildLoginHref,
  getProfileConfig,
  profileOrder,
  type UserProfile,
} from "@/lib/profiles";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function ProfileSelector() {
  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get("source");

  useEffect(() => {
    setPageMeta({
      title: "Escolha seu perfil | RED Registro Escolar Digital",
      description:
        "Escolha o perfil de acesso do RED e entre na plataforma com um login específico para escola, professor, aluno ou responsável.",
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <FloatingThemeToggle />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,17,32,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(135deg,_var(--background),_var(--muted))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(139,17,32,0.38),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.2),_transparent_28%),linear-gradient(135deg,_var(--background),_var(--muted))]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-red-brand/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.06),transparent_23%),radial-gradient(circle_at_80%_76%,rgba(255,255,255,0.05),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.04),transparent_23%),radial-gradient(circle_at_80%_76%,rgba(255,255,255,0.03),transparent_28%)]" />

      <main className="relative z-10">
        <section className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-8 py-8 lg:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <BrandTitleLogo href="/" className="mx-auto mb-4" />

            <h1 className="font-display text-3xl font-bold leading-[1.08] text-foreground md:text-5xl">
              Escolha como você vai entrar na plataforma.
            </h1>

            <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">
              O RED agora separa o acesso por perfil para que escola, professor,
              aluno e responsável sigam por caminhos próprios, com a mesma
              identidade visual da landing.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:gap-6">
            {profileOrder.map((profile: UserProfile) => {
              const profileConfig = getProfileConfig(profile);
              return (
                <a
                  key={profileConfig.id}
                  href={buildLoginHref(
                    profileConfig.id,
                    source || "profile-selector"
                  )}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-7 text-left shadow-[0_24px_60px_-28px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-26px_rgba(0,0,0,0.45)] lg:min-h-[305px]"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${profileConfig.softAccentClassName} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-brand/70 to-transparent" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div
                      className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${profileConfig.accentClassName} text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-105`}
                    >
                      <profileConfig.icon size={31} />
                    </div>

                    <h2 className="mt-1 font-heading text-2xl font-bold text-foreground md:text-[1.7rem]">
                      {profileConfig.title}
                    </h2>
                    <p className="mt-3 flex-1 font-body text-[0.95rem] leading-relaxed text-muted-foreground">
                      {profileConfig.description}
                    </p>

                    <div className="mt-8 flex items-center justify-between gap-3">
                      <span className="font-heading text-[0.95rem] font-semibold text-red-brand transition-colors group-hover:text-red-brand-dark">
                        Entrar como {profileConfig.title}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-red-brand transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
