import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "../components/ErrorBoundary";
import { Toaster } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { ThemeProvider } from "../contexts/ThemeContext";
import Home from "./routes/pages/Home";
import NotFound from "./routes/pages/NotFound";

const ProfileSelector = lazy(() => import("./routes/pages/ProfileSelector"));
const LoginPage = lazy(() => import("./routes/pages/LoginPage"));
const Dashboard = lazy(() => import("./routes/pages/Dashboard"));
const TeacherDashboard = lazy(() => import("./routes/pages/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./routes/pages/StudentDashboard"));
const GuardianDashboard = lazy(
  () => import("./routes/pages/GuardianDashboard")
);
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-muted-foreground">Carregando...</p>
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
          <TeacherDashboard />
        </Suspense>
      </Route>
      <Route path={"/student-dashboard"}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentDashboard />
        </Suspense>
      </Route>
      <Route path={"/guardian-dashboard"}>
        <Suspense fallback={<LoadingFallback />}>
          <GuardianDashboard />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
