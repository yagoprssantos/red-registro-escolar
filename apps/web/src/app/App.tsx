import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import BrandTitleLogo from "../components/BrandTitleLogo";
import ErrorBoundary from "../components/ErrorBoundary";
import { Toaster } from "../components/ui/sonner";
import { Spinner } from "../components/ui/spinner";
import { TooltipProvider } from "../components/ui/tooltip";
import { ThemeProvider } from "../contexts/ThemeContext";
import Home from "./routes/pages/Home";
import NotFound from "./routes/pages/NotFound";

const ProfileSelector = lazy(() => import("./routes/pages/ProfileSelector"));
const LoginPage = lazy(() => import("./routes/pages/LoginPage"));
const Dashboard = lazy(() => import("./routes/pages/Dashboard"));
const Onboarding = lazy(() => import("./routes/pages/Onboarding"));
const PrivacyPolicy = lazy(() => import("./routes/pages/legal/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./routes/pages/legal/TermsOfUse"));
const LGPDCompliance = lazy(
  () => import("./routes/pages/legal/LGPDCompliance")
);
const HelpCenter = lazy(() => import("./routes/pages/support/HelpCenter"));
const Documentation = lazy(
  () => import("./routes/pages/support/Documentation")
);
const SystemStatus = lazy(() => import("./routes/pages/support/SystemStatus"));

function LoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-background/45 p-4 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.12),transparent_28%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(255,255,255,0.75) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.75) 25%, transparent 25%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "24px 24px, 24px 24px, 18px 18px",
          backgroundPosition: "0 0, 0 0, 0 0",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_24%,transparent_76%,rgba(255,255,255,0.06))] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgba(15,23,42,0.08)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgba(15,23,42,0.14)_100%)]" />

      <div className="relative w-full max-w-sm rounded-[1.75rem] border border-border/70 bg-card/90 px-6 py-5 text-center shadow-[0_24px_80px_-28px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:px-7 sm:py-6">
        <div className="mx-auto mb-3 inline-flex rounded-xl border border-border/60 bg-background/70 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
          <BrandTitleLogo size="compact" className="pointer-events-none" />
        </div>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-brand/10 text-red-brand">
          <Spinner className="size-5" aria-label="Carregando rota" />
        </div>

        <p className="mt-4 font-heading text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Carregando conteúdo
        </p>

        <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
          Mantendo a tela visível enquanto a próxima página termina de carregar.
        </p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-brand/70 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-brand/70 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-brand/70" />
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/profile-selector"}>
        <Suspense fallback={<LoadingFallback />}>
          <ProfileSelector />
        </Suspense>
      </Route>
      <Route path={"/login"}>
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage />
        </Suspense>
      </Route>
      <Route path={"/dashboard"}>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard />
        </Suspense>
      </Route>
      <Route path={"/teacher-dashboard"}>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard />
        </Suspense>
      </Route>
      <Route path={"/student-dashboard"}>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard />
        </Suspense>
      </Route>
      <Route path={"/guardian-dashboard"}>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard />
        </Suspense>
      </Route>
      <Route path={"/onboarding"}>
        <Suspense fallback={<LoadingFallback />}>
          <Onboarding />
        </Suspense>
      </Route>
      <Route path={"/legal/privacy-policy"}>
        <Suspense fallback={<LoadingFallback />}>
          <PrivacyPolicy />
        </Suspense>
      </Route>
      <Route path={"/legal/terms"}>
        <Suspense fallback={<LoadingFallback />}>
          <TermsOfUse />
        </Suspense>
      </Route>
      <Route path={"/legal/lgpd"}>
        <Suspense fallback={<LoadingFallback />}>
          <LGPDCompliance />
        </Suspense>
      </Route>
      <Route path={"/support/help-center"}>
        <Suspense fallback={<LoadingFallback />}>
          <HelpCenter />
        </Suspense>
      </Route>
      <Route path={"/support/documentation"}>
        <Suspense fallback={<LoadingFallback />}>
          <Documentation />
        </Suspense>
      </Route>
      <Route path={"/support/system-status"}>
        <Suspense fallback={<LoadingFallback />}>
          <SystemStatus />
        </Suspense>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.12),transparent_30%),linear-gradient(135deg,var(--background),var(--muted))]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-soft-light"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, rgba(255,255,255,0.75) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.75) 25%, transparent 25%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
                backgroundSize: "24px 24px, 24px 24px, 18px 18px",
                backgroundPosition: "0 0, 0 0, 0 0",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_18%,transparent_82%,rgba(139,17,32,0.03)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_46%,rgba(15,23,42,0.08)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,transparent_46%,rgba(15,23,42,0.14)_100%)]" />
            <div className="relative z-10">
              <Router />
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
