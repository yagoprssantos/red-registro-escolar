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
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronsUpDown,
  LoaderCircle,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
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
  const isLoginTransitionLoading =
    isPasswordLoading || isOAuthLoading || isOAuthFinalizing;

  const loadingCopy = useMemo(() => {
    if (isOAuthFinalizing) {
      return {
        title: "Finalizando login OAuth",
        subtitle:
          "Estamos validando o retorno do provedor e criando a sessao segura no servidor.",
        detail: "Conferindo token OAuth",
      };
    }

    if (isOAuthLoading) {
      return {
        title: "Redirecionando para autenticacao",
        subtitle:
          "A conexao com o provedor externo esta sendo preparada com verificacoes de perfil.",
        detail: "Abrindo provedor OAuth",
      };
    }

    return {
      title: "Validando credenciais",
      subtitle:
        "Checando email, senha e perfil selecionado antes de liberar o acesso a plataforma.",
      detail: "Autenticando usuario",
    };
  }, [isOAuthFinalizing, isOAuthLoading]);

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
    setSelectedProfile(profileId);
    setIsProfilePickerOpen(false);

    window.setTimeout(() => {
      setIsProfileTransitioning(false);
    }, 240);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AnimatePresence>
        {isLoginTransitionLoading ? (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 p-8 text-center shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.08),transparent_40%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <BrandTitleLogo
                  className="pointer-events-none"
                  size="compact"
                />
                <h3 className="mt-6 font-heading text-xl font-bold text-foreground">
                  {loadingCopy.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {loadingCopy.subtitle}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5">
                  <LoaderCircle
                    className="animate-spin text-red-brand"
                    size={12}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {loadingCopy.detail}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <FloatingThemeToggle />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,17,32,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.15),_transparent_30%),linear-gradient(135deg,_var(--background),_var(--muted))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(139,17,32,0.34),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,_var(--background),_var(--muted))]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.065] mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(255,255,255,0.75) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.75) 25%, transparent 25%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "24px 24px, 24px 24px, 20px 20px",
          backgroundPosition: "0 0, 0 0, 0 0",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.06),transparent_24%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.05),transparent_28%)] dark:bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.04),transparent_24%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.03),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgba(15,23,42,0.08)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,transparent_46%,rgba(15,23,42,0.12)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_18%,transparent_82%,rgba(139,17,32,0.03)_100%)]" />

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

          <motion.section
            layout
            className={`rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 sm:p-8 ${
              isProfileTransitioning
                ? "opacity-95 translate-y-1"
                : "opacity-100 translate-y-0"
            }`}
            animate={
              isProfileTransitioning
                ? { opacity: 0.96, y: 4, scale: 0.996 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
              <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Acessando como
              </p>

              <motion.div
                layout
                className="mt-3 rounded-xl border border-border bg-background/70 p-3 sm:p-4"
              >
                <motion.div
                  key={`active-profile-${selectedProfile}`}
                  initial={{ opacity: 0, y: 8, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-3"
                >
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
                    disabled={isProfileTransitioning}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-heading text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
                  >
                    {isProfileTransitioning ? (
                      <LoaderCircle
                        className="animate-spin text-muted-foreground"
                        size={12}
                      />
                    ) : null}
                    {isProfilePickerOpen ? "Fechar" : "Trocar perfil"}
                    <motion.span
                      animate={{ rotate: isProfilePickerOpen ? 180 : 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <ChevronsUpDown size={13} />
                    </motion.span>
                  </button>
                </motion.div>

                <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-background/50 p-4 shadow-inner md:flex-row md:items-center md:p-5">
                  <div className="flex-1 min-w-0 pr-3">
                    <h2 className="mb-2 font-heading text-lg font-bold text-foreground">
                      Selecione o perfil
                    </h2>
                    <p className="font-body text-sm leading-relaxed text-muted-foreground">
                      O acesso a plataforma e concedido com base no cargo do
                      usuario. Se voce possui multiplos cargos na RED, escolha o
                      perfil que deseja abrir.
                    </p>
                  </div>

                  <div className="relative shrink-0 md:w-56 mt-3 md:mt-0">
                    <button
                      type="button"
                      onClick={() => setIsProfilePickerOpen(prev => !prev)}
                      disabled={isProfileTransitioning}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 font-heading text-sm font-semibold text-foreground transition-all hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-red-brand/50 sm:p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${profile.accentClassName} text-white shadow-sm`}
                        >
                          <profile.icon size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="block">{profile.title}</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isProfilePickerOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronsUpDown
                          size={16}
                          className="text-muted-foreground"
                        />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isProfilePickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-md"
                        >
                          <div className="max-h-64 space-y-1 overflow-y-auto">
                            {profileOrder.map(profileId => {
                              const option = getProfileConfig(profileId);
                              const checked = profileId === selectedProfile;

                              return (
                                <button
                                  key={profileId}
                                  type="button"
                                  onClick={() => handleSelectProfile(profileId)}
                                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                    checked
                                      ? "bg-red-brand/10"
                                      : "hover:bg-muted/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${option.accentClassName} text-white ${!checked && "opacity-75"}`}
                                    >
                                      <option.icon size={14} />
                                    </div>
                                    <span
                                      className={`font-heading text-sm ${checked ? "font-bold text-red-brand" : "font-medium text-foreground"} `}
                                    >
                                      {option.title}
                                    </span>
                                  </div>
                                  {checked && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="h-5 w-5 rounded-full bg-red-brand text-white flex items-center justify-center"
                                    >
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                    </motion.div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
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
                      {selectedProfile === "guardian"
                        ? "Email do Responsável"
                        : "Email Institucional"}
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder={
                        selectedProfile === "guardian"
                          ? "responsavel@exemplo.com"
                          : "usuario@escola.edu.br"
                      }
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
                {isPasswordLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    <LoaderCircle size={18} />
                  </motion.span>
                ) : (
                  <LogIn size={18} />
                )}
                {isPasswordLoading
                  ? "Validando credenciais..."
                  : `Entrar como ${profile.title}`}
                <ArrowRight
                  size={16}
                  className={`transition-transform ${
                    isPasswordLoading
                      ? "opacity-0"
                      : "group-hover:translate-x-1"
                  }`}
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
          </motion.section>
        </div>
      </main>
    </div>
  );
}
