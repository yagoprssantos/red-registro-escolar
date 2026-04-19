/*
 * LoginPage — RED Registro Escolar Digital
 * Página de login com redirecionamento OAuth por perfil
 */

import { useAuth } from "@/_core/hooks/useAuth";
import BrandTitleLogo from "@/components/BrandTitleLogo";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import { getLoginUrl } from "@/const";
import { setPageMeta } from "@/lib/pageMeta";
import {
  getProfileConfig,
  isUserProfile,
  profileOrder,
  type UserProfile,
} from "@/lib/profiles";
import { ArrowRight, LogIn, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type LoginField = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email";
};

const profileInputConfig: Record<UserProfile, LoginField[]> = {
  school: [
    {
      key: "schoolEmail",
      label: "Email institucional",
      placeholder: "direcao@escola.edu.br",
      type: "email",
    },
    {
      key: "schoolCode",
      label: "Codigo da unidade",
      placeholder: "Ex.: RED-0231",
    },
  ],
  teacher: [
    {
      key: "teacherEmail",
      label: "Email profissional",
      placeholder: "professor@escola.edu.br",
      type: "email",
    },
    {
      key: "teacherRegistration",
      label: "Registro funcional",
      placeholder: "Ex.: RF-34812",
    },
  ],
  student: [
    {
      key: "studentEmail",
      label: "Email do aluno",
      placeholder: "aluno@escola.edu.br",
      type: "email",
    },
    {
      key: "studentEnrollment",
      label: "Matricula",
      placeholder: "Ex.: 2026-001245",
    },
  ],
  guardian: [
    {
      key: "guardianEmail",
      label: "Email do responsavel",
      placeholder: "responsavel@email.com",
      type: "email",
    },
    {
      key: "studentReference",
      label: "Codigo do aluno",
      placeholder: "Ex.: AL-7719",
    },
  ],
};

const demoValuesByProfile: Record<UserProfile, Record<string, string>> = {
  school: {
    schoolEmail: "demo.escola@red.local",
    schoolCode: "RED-DEMO-SCHOOL",
  },
  teacher: {
    teacherEmail: "demo.professor@red.local",
    teacherRegistration: "RF-DEMO-001",
  },
  student: {
    studentEmail: "demo.aluno@red.local",
    studentEnrollment: "MAT-DEMO-2026",
  },
  guardian: {
    guardianEmail: "demo.responsavel@red.local",
    studentReference: "ALUNO-DEMO-01",
  },
};

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const pageParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  const initialProfile = useMemo(() => {
    const profileParam = pageParams.get("profile");
    const storedProfile = sessionStorage.getItem("selectedProfile");

    if (isUserProfile(profileParam)) {
      return profileParam;
    }

    if (isUserProfile(storedProfile)) {
      return storedProfile;
    }

    return "school";
  }, [pageParams]);

  const [selectedProfile, setSelectedProfile] =
    useState<UserProfile>(initialProfile);
  const [isProfileTransitioning, setIsProfileTransitioning] = useState(false);
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const profile = getProfileConfig(selectedProfile);
  const currentLoginFields = profileInputConfig[selectedProfile];
  const isLoginReady = currentLoginFields.every(field =>
    Boolean(formValues[field.key]?.trim())
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(profile.dashboardPath);
    }
  }, [isAuthenticated, navigate, profile.dashboardPath]);

  useEffect(() => {
    sessionStorage.setItem("selectedProfile", selectedProfile);
    const params = new URLSearchParams(window.location.search);
    params.set("profile", selectedProfile);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    );

    setPageMeta({
      title: `${profile.title} | Acesso RED Registro Escolar Digital`,
      description: `Entre no RED como ${profile.title.toLowerCase()} e continue para o painel específico da sua rotina escolar.`,
    });
  }, [profile.title, selectedProfile]);

  const handleLogin = () => {
    if (!isLoginReady) {
      setLoginMessage("Preencha os campos de login antes de continuar.");
      return;
    }

    const params = new URLSearchParams();
    params.set("profile", selectedProfile);

    profileInputConfig[selectedProfile].forEach(field => {
      const value = formValues[field.key]?.trim();
      if (value) {
        params.set(field.key, value);
      }
    });

    setLoginMessage(null);
    window.location.href = getLoginUrl(
      `${profile.dashboardPath}?${params.toString()}`
    );
  };

  const handleDemoLogin = async () => {
    const demoValues = demoValuesByProfile[selectedProfile];
    setFormValues(prev => ({ ...prev, ...demoValues }));
    setLoginMessage(null);
    setIsDemoLoading(true);

    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profile: selectedProfile,
          returnPath: `${profile.dashboardPath}?profile=${selectedProfile}&mode=demo`,
          loginFields: demoValues,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha no login demo");
      }

      const payload = (await response.json()) as {
        success: boolean;
        redirectTo?: string;
      };

      window.location.href =
        payload.redirectTo ??
        `${profile.dashboardPath}?profile=${selectedProfile}&mode=demo`;
    } catch (_error) {
      setLoginMessage(
        "Nao foi possivel entrar no modo demo agora. Tente novamente em instantes."
      );
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSelectProfile = (profileId: UserProfile) => {
    if (profileId === selectedProfile || isProfileTransitioning) {
      return;
    }

    setIsProfileTransitioning(true);

    window.setTimeout(() => {
      setSelectedProfile(profileId);
      setIsProfilePickerOpen(false);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsProfileTransitioning(false);
        });
      });
    }, 140);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <FloatingThemeToggle />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,17,32,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.15),_transparent_30%),linear-gradient(135deg,_var(--background),_var(--muted))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(139,17,32,0.34),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,_var(--background),_var(--muted))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.06),transparent_24%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.05),transparent_28%)] dark:bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.04),transparent_24%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.03),transparent_28%)]" />

      <div className="pointer-events-none absolute left-1/2 top-7 z-20 -translate-x-1/2">
        <BrandTitleLogo href="/" className="pointer-events-auto" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center px-4 py-8 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mx-auto mb-8 max-w-3xl text-center lg:mb-10">
            <h1 className="font-display text-3xl font-bold leading-[1.05] text-foreground md:text-5xl">
              Escolha como você vai entrar na plataforma.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">
              O acesso foi ajustado para preservar a identidade do RED e
              conduzir você para o painel certo desde o primeiro clique.
            </p>
          </div>

          <section
            className={`rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 sm:p-8 ${
              isProfileTransitioning
                ? "opacity-95 translate-y-1"
                : "opacity-100 translate-y-0"
            }`}
          >
            <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
              <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Acessando como
              </p>

              <div className="mt-3 rounded-xl border border-border bg-background/70 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${profile.accentClassName} text-white shadow-lg shadow-black/10`}
                  >
                    <profile.icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-semibold text-foreground">
                      {profile.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfilePickerOpen(prev => !prev);
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 font-heading text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
                  >
                    {isProfilePickerOpen ? "Fechar" : "Alterar login"}
                  </button>
                </div>

                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                  {profile.description}
                </p>

                {isProfilePickerOpen ? (
                  <div className="mt-4 rounded-lg border border-border bg-background/80 p-2">
                    <div className="space-y-1.5">
                      {profileOrder.map((profileId: UserProfile) => {
                        const profileOption = getProfileConfig(profileId);
                        const checked = profileId === selectedProfile;

                        return (
                          <label
                            key={profileOption.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 transition-colors ${
                              checked
                                ? "border-red-brand/50 bg-red-brand/10"
                                : "border-border bg-background/50 hover:bg-muted/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="profile"
                              checked={checked}
                              onChange={() =>
                                handleSelectProfile(profileOption.id)
                              }
                              className="h-3.5 w-3.5 accent-red-brand"
                            />
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${profileOption.accentClassName} text-white`}
                            >
                              <profileOption.icon size={14} />
                            </div>
                            <span className="min-w-0 flex-1 truncate font-body text-sm text-foreground">
                              {profileOption.title}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Autenticação OAuth segura",
                    "Redirecionamento para o painel correto",
                    "Contexto preservado por perfil",
                  ].map(feature => (
                    <span
                      key={feature}
                      className="rounded-full border border-border bg-background/70 px-3 py-1.5 font-body text-[11px] text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="mt-6 font-heading text-2xl font-bold text-foreground md:text-3xl">
              Continue para entrar com segurança.
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground md:text-base">
              Depois do OAuth, você retorna diretamente ao painel associado ao
              seu perfil atual.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Dados de login
              </h3>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Preencha estes dados para continuar no fluxo de autenticação
                OAuth com o perfil selecionado.
              </p>

              <div className="mt-4 space-y-3">
                {currentLoginFields.map(field => (
                  <label key={field.key} className="block">
                    <span className="mb-1.5 block font-body text-xs font-medium text-muted-foreground">
                      {field.label}
                    </span>
                    <input
                      type={field.type ?? "text"}
                      value={formValues[field.key] ?? ""}
                      onChange={event =>
                        setFormValues(prev => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-border bg-background/90 px-3 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-red-brand/60"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!isLoginReady || isDemoLoading}
              className={`group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${profile.accentClassName} px-6 py-4 font-heading text-sm font-semibold text-white shadow-lg shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl`}
            >
              <LogIn size={18} />
              Entrar como {profile.title}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <button
              onClick={handleDemoLogin}
              disabled={isDemoLoading}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 px-6 py-3 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-70"
            >
              <Sparkles size={16} />
              {isDemoLoading ? "Entrando no modo demo..." : "Entrar como demo"}
            </button>

            {loginMessage ? (
              <p className="mt-3 font-body text-xs text-red-brand">
                {loginMessage}
              </p>
            ) : null}

            <p className="mt-5 font-body text-xs text-muted-foreground">
              Você será redirecionado para autenticação segura via OAuth antes
              de acessar o painel do RED.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
