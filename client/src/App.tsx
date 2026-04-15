import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const ProfileSelector = lazy(() => import('./pages/ProfileSelector'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const GuardianDashboard = lazy(() => import('./pages/GuardianDashboard'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-gray-600">Carregando...</p>
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
