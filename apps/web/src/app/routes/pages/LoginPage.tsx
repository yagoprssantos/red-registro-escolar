/*
 * LoginPage — RED Registro Escolar Digital
 * Página de login real com Supabase Auth (senha + OAuth)
 */

import BrandTitleLogo from "@/components/BrandTitleLogo";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import { useAuth } from "@/core/hooks/useAuth";
import { setPageMeta } from "@/lib/pageMeta";
import {
  getProfileConfig,
  isUserProfile,
  profileOrder,
  type UserProfile,
} from "@/lib/profiles";
import { ArrowRight, Lock, LogIn, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type LoginPayload = {
  success: boolean;
  redirectTo?: string;
  error?: string;
};

function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.61v2.99h3.86c2.26-2.08 3.58-5.15 3.58-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.86-2.99c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.76-2.11-6.7-4.96H1.31v3.08A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.29A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.57.36-2.29V6.63H1.31A11.99 11.99 0 0 0 0 12c0 1.93.46 3.75 1.31 5.37l3.99-3.08z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.15 15.24 0 12 0 7.31 0 3.28 2.69 1.31 6.63l3.99 3.08C6.24 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  );
}

function isSafeRelativePath(pathname: string | null): pathname is string {
  if (!pathname) return false;
  if (!pathname.startsWith("/")) return false;
  if (pathname.startsWith("//")) return false;
  return true;
}

function withProfile(pathname: string, profile: UserProfile) {
  const parsed = new URL(pathname, window.location.origin);
  parsed.searchParams.set("profile", profile);
  return `${parsed.pathname}${parsed.search}`;
}

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isOAuthFinalizing, setIsOAuthFinalizing] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const profile = getProfileConfig(selectedProfile);

  const returnPath = useMemo(() => {
    const requestedReturnPath = pageParams.get("returnPath");

    if (isSafeRelativePath(requestedReturnPath)) {
      return withProfile(requestedReturnPath, selectedProfile);
    }

    return `/dashboard?profile=${selectedProfile}`;
  }, [pageParams, selectedProfile]);

  const isLoginReady = Boolean(email.trim() && password.trim());

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    sessionStorage.setItem("selectedProfile", selectedProfile);

    const params = new URLSearchParams(window.location.search);
    params.set("profile", selectedProfile);

    if (isSafeRelativePath(pageParams.get("returnPath"))) {
      params.set("returnPath", returnPath);
    }

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    );

    setPageMeta({
      title: `${profile.title} | Acesso RED Registro Escolar Digital`,
      description: `Acesse o RED como ${profile.title.toLowerCase()} com autenticação real para operação escolar em produção.`,
    });
  }, [pageParams, profile.title, returnPath, selectedProfile]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    const hashParams = new URLSearchParams(hash.slice(1));
    const accessToken = hashParams.get("access_token");
    if (!accessToken) return;

    let aborted = false;

    const finalizeOAuth = async () => {
      setIsOAuthFinalizing(true);
      setLoginMessage(null);

      try {
        const response = await fetch("/api/auth/supabase/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            accessToken,
            profile: selectedProfile,
            returnPath,
          }),
        });

        const payload = (await response.json()) as LoginPayload;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Falha ao finalizar OAuth.");
        }

        if (!aborted) {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?profile=${selectedProfile}&returnPath=${encodeURIComponent(returnPath)}`
          );

          window.location.href = payload.redirectTo || returnPath;
        }
      } catch (error) {
        if (!aborted) {
          setLoginMessage(
            error instanceof Error
              ? error.message
              : "Nao foi possivel concluir o login OAuth."
          );
        }
      } finally {
        if (!aborted) {
          setIsOAuthFinalizing(false);
        }
      }
    };

    void finalizeOAuth();

    return () => {
      aborted = true;
    };
  }, [returnPath, selectedProfile]);

  const handlePasswordLogin = async () => {
    if (!isLoginReady || isOAuthFinalizing) {
      return;
    }

    setIsPasswordLoading(true);
    setLoginMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          profile: selectedProfile,
          returnPath,
        }),
      });

      const payload = (await response.json()) as LoginPayload;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Falha no login com senha.");
      }

      window.location.href = payload.redirectTo || returnPath;
    } catch (error) {
      setLoginMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel autenticar com email e senha."
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleOAuthStart = (provider: "google") => {
    if (isPasswordLoading || isOAuthFinalizing) return;

    setIsOAuthLoading(true);
    setLoginMessage(null);

    const params = new URLSearchParams({
      provider,
      profile: selectedProfile,
      returnPath,
    });

    window.location.href = `/api/auth/oauth/start?${params.toString()}`;
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
              Acesse com autenticação real.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">
              Fluxo pronto para produção com Supabase Auth, sessão segura no
              backend e perfil autorizado no dashboard.
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
                    {isProfilePickerOpen ? "Fechar" : "Trocar perfil"}
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
              </div>
            </div>

            <h2 className="mt-6 font-heading text-2xl font-bold text-foreground md:text-3xl">
              Entre com email e senha
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground md:text-base">
              Sessão assinada no servidor e controle de perfil aplicado a partir
              da identidade persistida no banco.
            </p>

            <form
              className="mt-6"
              onSubmit={event => {
                event.preventDefault();
                void handlePasswordLogin();
              }}
            >
              <div className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Credenciais
                </h3>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 font-body text-xs font-medium text-muted-foreground">
                      <Mail size={13} />
                      Email Institucional
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="usuario@escola.edu.br"
                      autoComplete="email"
                      className="w-full rounded-lg border border-border bg-background/90 px-3 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-red-brand/60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 font-body text-xs font-medium text-muted-foreground">
                      <Lock size={13} />
                      Senha
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-border bg-background/90 px-3 py-2.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-red-brand/60"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  !isLoginReady || isPasswordLoading || isOAuthFinalizing
                }
                className={`group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${profile.accentClassName} px-6 py-4 font-heading text-sm font-semibold text-white shadow-lg shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <LogIn size={18} />
                {isPasswordLoading
                  ? "Validando credenciais..."
                  : `Entrar como ${profile.title}`}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <div className="mt-4">
              <button
                onClick={() => handleOAuthStart("google")}
                disabled={
                  isOAuthLoading || isPasswordLoading || isOAuthFinalizing
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-70"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <GoogleLogo />
                </span>
                {isOAuthLoading
                  ? "Redirecionando para Google..."
                  : "Entrar com Google"}
              </button>
            </div>

            {isOAuthFinalizing ? (
              <p className="mt-3 font-body text-xs text-blue-brand">
                Finalizando sessão OAuth com o servidor...
              </p>
            ) : null}

            {loginMessage ? (
              <p className="mt-3 font-body text-xs text-red-brand">
                {loginMessage}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
