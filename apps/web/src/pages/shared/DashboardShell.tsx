import BrandLogo from "@/components/BrandLogo";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/core/hooks/useAuth";
import {
  getProfileConfig,
  isUserProfile,
  type UserProfile,
} from "@/lib/profiles";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  LayoutGrid,
  Link2,
  LogOut,
  Megaphone,
  MessageSquare,
  Monitor,
  School,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { NotificationBell } from "./NotificationBell";

// ── Types ─────────────────────────────────────────────────────────
type RegistryRow = Record<string, unknown>;

type DashboardSection = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

// ── Profile colours (avatar accent per profile) ───────────────────
const PROFILE_ACCENT: Record<UserProfile, string> = {
  school: "from-red-brand to-red-700",
  teacher: "from-blue-brand to-blue-700",
  student: "from-emerald-600 to-emerald-800",
  guardian: "from-violet-600 to-violet-800",
};

const PROFILE_INITIALS_BG: Record<UserProfile, string> = {
  school: "bg-red-brand/15 text-red-brand",
  teacher: "bg-blue-brand/15 text-blue-brand",
  student: "bg-emerald-500/15 text-emerald-600",
  guardian: "bg-violet-500/15 text-violet-600",
};

// ── Role → profile map ────────────────────────────────────────────
const PROFILE_BY_ROLE: Record<string, UserProfile> = {
  admin: "school",
  school_staff: "school",
  teacher: "teacher",
  student: "student",
  guardian: "guardian",
};

// ── Sections ──────────────────────────────────────────────────────
const PROFILE_SECTIONS: Record<UserProfile, DashboardSection[]> = {
  school: [
    {
      id: "overview",
      title: "Dashboard",
      description: "Resumo da operação institucional.",
      icon: LayoutGrid,
    },
    {
      id: "students",
      title: "Alunos",
      description: "Cadastro e acompanhamento de estudantes.",
      icon: GraduationCap,
    },
    {
      id: "classes",
      title: "Turmas",
      description: "Turmas e matrículas.",
      icon: Users,
    },
    {
      id: "teachers",
      title: "Professores",
      description: "Corpo docente.",
      icon: School,
    },
    {
      id: "communications",
      title: "Comunicados",
      description: "Mensagens para a comunidade escolar.",
      icon: MessageSquare,
    },
    {
      id: "events",
      title: "Eventos",
      description: "Calendário escolar.",
      icon: CalendarClock,
    },
    {
      id: "justifications",
      title: "Justificativas",
      description: "Revisão de justificativas de falta.",
      icon: ShieldCheck,
    },
    {
      id: "reports",
      title: "Relatórios",
      description: "Frequência e desempenho.",
      icon: FileText,
    },
    {
      id: "settings",
      title: "Configurações",
      description: "Ano letivo, usuários e LGPD.",
      icon: Settings,
    },
  ],
  teacher: [
    {
      id: "overview",
      title: "Início",
      description: "Resumo das turmas e do dia letivo.",
      icon: LayoutGrid,
    },
    {
      id: "attendance",
      title: "Chamada",
      description: "Registro rápido de faltas e presenças.",
      icon: ClipboardList,
    },
    {
      id: "grades",
      title: "Avaliações",
      description: "Lançamento e atualização de notas.",
      icon: BookOpenCheck,
    },
    {
      id: "comments",
      title: "Comentários",
      description: "Ocorrências, elogios e melhorias.",
      icon: FileText,
    },
    {
      id: "communications",
      title: "Comunicados",
      description: "Avisos da escola.",
      icon: Bell,
    },
  ],
  student: [
    {
      id: "overview",
      title: "Início",
      description: "Resumo geral.",
      icon: LayoutGrid,
    },
    {
      id: "personal",
      title: "Dados Pessoais",
      description: "Informações pessoais e matrícula.",
      icon: User,
    },
    {
      id: "myclass",
      title: "Minha Turma",
      description: "Colegas, professores e detalhes.",
      icon: Users,
    },
    {
      id: "schedule",
      title: "Horário",
      description: "Grade de aulas semanal.",
      icon: Clock,
    },
    {
      id: "calendar",
      title: "Calendário Letivo",
      description: "Provas, feriados e eventos.",
      icon: Calendar,
    },
    {
      id: "transcript",
      title: "Boletim",
      description: "Notas e médias por disciplina.",
      icon: BarChart3,
    },
    {
      id: "attendance",
      title: "Frequência",
      description: "Presenças, faltas e Pé de Meia.",
      icon: ClipboardList,
    },
    {
      id: "onlineassessments",
      title: "Avaliações Online",
      description: "Avaliações disponíveis.",
      icon: Monitor,
    },
    {
      id: "bio",
      title: "Ficha Biográfica",
      description: "Histórico e dados completos.",
      icon: Heart,
    },
    {
      id: "platforms",
      title: "Plataformas",
      description: "Google Classroom, SISEDU e outros.",
      icon: Link2,
    },
    {
      id: "communications",
      title: "Comunicados",
      description: "Avisos da escola.",
      icon: Bell,
    },
    {
      id: "events",
      title: "Eventos",
      description: "Calendário escolar.",
      icon: CalendarClock,
    },
    {
      id: "tutorial",
      title: "Tutorial",
      description: "Como usar o RED.",
      icon: HelpCircle,
    },
  ],
  guardian: [
    {
      id: "overview",
      title: "Início",
      description: "Alertas e resumo do filho.",
      icon: LayoutGrid,
    },
    {
      id: "attendance",
      title: "Frequência",
      description: "Faltas e presenças do filho.",
      icon: ClipboardList,
    },
    {
      id: "grades",
      title: "Desempenho",
      description: "Notas do filho.",
      icon: BookOpenCheck,
    },
    {
      id: "comments",
      title: "Comentários",
      description: "Ocorrências com autoria.",
      icon: MessageSquare,
    },
    {
      id: "communications",
      title: "Comunicados",
      description: "Avisos da escola.",
      icon: Bell,
    },
    {
      id: "events",
      title: "Eventos",
      description: "Calendário escolar.",
      icon: CalendarClock,
    },
    {
      id: "justifications",
      title: "Justificativas",
      description: "Justificar faltas do filho.",
      icon: ShieldCheck,
    },
    {
      id: "news",
      title: "Notícias",
      description: "Novidades e reuniões.",
      icon: Megaphone,
    },
    {
      id: "platforms",
      title: "Plataformas",
      description: "Links e acessos parceiros.",
      icon: Link2,
    },
    {
      id: "tutorial",
      title: "Tutorial",
      description: "Como usar o RED.",
      icon: HelpCircle,
    },
  ],
};

function resolveProfileFromRole(
  role: string | null | undefined
): UserProfile | null {
  if (!role) return null;
  return PROFILE_BY_ROLE[role] ?? null;
}

function getFirstSectionId(profile: UserProfile): string {
  return PROFILE_SECTIONS[profile][0]?.id ?? "overview";
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

// ── Lazy-loaded page components ───────────────────────────────────
// School
const SchoolOverview = lazy(
  () => import("../app/school/dashboard/SchoolDashboard")
);
const SchoolStudents = lazy(
  () => import("../app/school/dashboard/SchoolStudents")
);
const SchoolClasses = lazy(
  () => import("../app/school/dashboard/SchoolClasses")
);
const SchoolTeachers = lazy(
  () => import("../app/school/dashboard/SchoolTeachers")
);
const SchoolCommunications = lazy(
  () => import("../app/school/dashboard/SchoolCommunications")
);
const SchoolEvents = lazy(() => import("../app/school/dashboard/SchoolEvents"));
const SchoolJustifications = lazy(
  () => import("../app/school/dashboard/SchoolJustifications")
);
const SchoolReports = lazy(
  () => import("../app/school/dashboard/SchoolReports")
);
const SchoolSettings = lazy(
  () => import("../app/school/dashboard/SchoolSettings")
);
// Teacher
const TeacherOverview = lazy(
  () => import("../app/teacher/dashboard/TeacherDashboard")
);
const TeacherAttendance = lazy(
  () => import("../app/teacher/dashboard/TeacherAttendance")
);
const TeacherGrades = lazy(
  () => import("../app/teacher/dashboard/TeacherGrades")
);
const TeacherComments = lazy(
  () => import("../app/teacher/dashboard/TeacherComments")
);
const TeacherCommunications = lazy(
  () => import("../app/teacher/dashboard/TeacherCommunications")
);
// Student
const StudentOverview = lazy(
  () => import("../app/student/dashboard/StudentDashboard")
);
const StudentPersonal = lazy(
  () => import("../app/student/dashboard/StudentPersonal")
);
const StudentMyClass = lazy(
  () => import("../app/student/dashboard/StudentMyClass")
);
const StudentSchedule = lazy(
  () => import("../app/student/dashboard/StudentSchedule")
);
const StudentCalendar = lazy(
  () => import("../app/student/dashboard/StudentCalendar")
);
const StudentTranscript = lazy(
  () => import("../app/student/dashboard/StudentTranscript")
);
const StudentAttendance = lazy(
  () => import("../app/student/dashboard/StudentAttendance")
);
const StudentOnlineAssessments = lazy(
  () => import("../app/student/dashboard/StudentOnlineAssessments")
);
const StudentBio = lazy(() => import("../app/student/dashboard/StudentBio"));
const StudentPlatforms = lazy(
  () => import("../app/student/dashboard/StudentPlatforms")
);
const StudentCommunications = lazy(
  () => import("../app/student/dashboard/StudentCommunications")
);
const StudentEvents = lazy(
  () => import("../app/student/dashboard/StudentEvents")
);
// Guardian
const GuardianOverview = lazy(
  () => import("../app/guardian/dashboard/GuardianDashboard")
);
const GuardianAttendance = lazy(
  () => import("../app/guardian/dashboard/GuardianAttendance")
);
const GuardianGrades = lazy(
  () => import("../app/guardian/dashboard/GuardianGrades")
);
const GuardianComments = lazy(
  () => import("../app/guardian/dashboard/GuardianComments")
);
const GuardianCommunications = lazy(
  () => import("../app/guardian/dashboard/GuardianCommunications")
);
const GuardianEvents = lazy(
  () => import("../app/guardian/dashboard/GuardianEvents")
);
const GuardianJustifications = lazy(
  () => import("../app/guardian/dashboard/GuardianJustify")
);
const GuardianNews = lazy(
  () => import("../app/guardian/dashboard/GuardianNews")
);
const GuardianPlatforms = lazy(
  () => import("../app/guardian/dashboard/GuardianPlatforms")
);

function ContentLoader() {
  return (
    <div className="animate-pulse space-y-4 p-4 md:p-6">
      <div className="h-6 w-48 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}

function getSectionComponent(profile: UserProfile, sectionId: string) {
  switch (`${profile}:${sectionId}`) {
    case "school:overview":
      return SchoolOverview;
    case "school:students":
      return SchoolStudents;
    case "school:classes":
      return SchoolClasses;
    case "school:teachers":
      return SchoolTeachers;
    case "school:communications":
      return SchoolCommunications;
    case "school:events":
      return SchoolEvents;
    case "school:justifications":
      return SchoolJustifications;
    case "school:reports":
      return SchoolReports;
    case "school:settings":
      return SchoolSettings;
    case "teacher:overview":
      return TeacherOverview;
    case "teacher:attendance":
      return TeacherAttendance;
    case "teacher:grades":
      return TeacherGrades;
    case "teacher:comments":
      return TeacherComments;
    case "teacher:communications":
      return TeacherCommunications;
    case "student:overview":
      return StudentOverview;
    case "student:personal":
      return StudentPersonal;
    case "student:myclass":
      return StudentMyClass;
    case "student:schedule":
      return StudentSchedule;
    case "student:calendar":
      return StudentCalendar;
    case "student:transcript":
      return StudentTranscript;
    case "student:attendance":
      return StudentAttendance;
    case "student:onlineassessments":
      return StudentOnlineAssessments;
    case "student:bio":
      return StudentBio;
    case "student:platforms":
      return StudentPlatforms;
    case "student:communications":
      return StudentCommunications;
    case "student:events":
      return StudentEvents;
    case "guardian:overview":
      return GuardianOverview;
    case "guardian:attendance":
      return GuardianAttendance;
    case "guardian:grades":
      return GuardianGrades;
    case "guardian:comments":
      return GuardianComments;
    case "guardian:communications":
      return GuardianCommunications;
    case "guardian:events":
      return GuardianEvents;
    case "guardian:justifications":
      return GuardianJustifications;
    case "guardian:news":
      return GuardianNews;
    case "guardian:platforms":
      return GuardianPlatforms;
    default:
      return null;
  }
}

// ── Settings modal ────────────────────────────────────────────────
function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={ref}
            className="relative z-10 w-full max-w-sm rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Sistema
                </p>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Configurações
                </h2>
              </div>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted/50"
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    Aparência
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Alternar entre claro e escuro
                  </p>
                </div>
                <ThemeToggleButton compact />
              </div>

              {/* Language placeholder */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 opacity-50">
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    Idioma
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Português (BR)
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 font-body text-[11px] text-muted-foreground">
                  Em breve
                </span>
              </div>

              {/* Privacy placeholder */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 opacity-50">
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    Privacidade
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Dados e LGPD
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 font-body text-[11px] text-muted-foreground">
                  Em breve
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Mobile bottom nav ─────────────────────────────────────────────
function MobileBottomNav({
  sections,
  activeSection,
  onSelect,
  onMoreClick,
}: {
  sections: DashboardSection[];
  activeSection: string | null;
  onSelect: (id: string) => void;
  onMoreClick: () => void;
}) {
  const primary = sections.slice(0, 4);
  const hasMore = sections.length > 4;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around">
        {primary.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSelect(section.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 transition-colors ${
                isActive ? "text-red-brand" : "text-muted-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`size-5 transition-transform ${isActive ? "scale-110" : ""}`}
              />
              <span
                className={`truncate font-body text-[10px] ${isActive ? "font-semibold" : ""}`}
              >
                {section.title}
              </span>
            </button>
          );
        })}
        {hasMore && (
          <button
            onClick={onMoreClick}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 transition-colors ${
              sections.slice(4).some(s => s.id === activeSection)
                ? "text-red-brand"
                : "text-muted-foreground"
            }`}
          >
            <Users className="size-5" />
            <span className="truncate font-body text-[10px]">Mais</span>
          </button>
        )}
      </div>
    </nav>
  );
}

// ── Mobile "Mais" drawer ──────────────────────────────────────────
function MobileMoreDrawer({
  sections,
  activeSection,
  onSelect,
  open,
  onClose,
}: {
  sections: DashboardSection[];
  activeSection: string | null;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="absolute bottom-16 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 shadow-xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: 20 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Todas as seções
              </p>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted/50"
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      onSelect(section.id);
                      onClose();
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 ${
                      isActive
                        ? "border-red-brand bg-red-brand text-white shadow-md shadow-red-brand/10"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-body text-xs leading-tight">
                      {section.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main shell ────────────────────────────────────────────────────
export default function DashboardShell() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const profile = useMemo(() => {
    if (!user) return null;
    return (
      resolveProfileFromRole(user.role) ??
      (isUserProfile((user as RegistryRow).defaultProfile as string)
        ? ((user as RegistryRow).defaultProfile as UserProfile)
        : "school")
    );
  }, [user]);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.localStorage.getItem("dashboard-sidebar-collapsed") === "true"
    );
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (profile) setActiveSection(getFirstSectionId(profile));
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    window.localStorage.setItem(
      "dashboard-sidebar-collapsed",
      isSidebarCollapsed ? "true" : "false"
    );
  }, [isSidebarCollapsed]);

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Spinner className="size-4" aria-label="Carregando dashboard" />
          Carregando dashboard...
        </div>
      </div>
    );
  }

  const sections = PROFILE_SECTIONS[profile];
  const SectionComponent = activeSection
    ? getSectionComponent(profile, activeSection)
    : null;
  const profileConfig = getProfileConfig(profile);
  const currentSection = sections.find(s => s.id === activeSection) ?? null;

  const userName = ((user as RegistryRow).name as string) ?? "Usuário";
  const userFirstName = userName.split(" ")[0] ?? "Usuário";
  const userInitials = getInitials(userName);
  const accentGradient = PROFILE_ACCENT[profile];
  const avatarBg = PROFILE_INITIALS_BG[profile];

  return (
    <div className="relative h-screen overflow-hidden bg-muted/30 text-foreground">
      {/* ── Decorative background ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.09),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.14),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(139,17,32,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(31,58,95,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70" />

      {/* ── Fixed layout wrapper (header + sidebar + main) ── */}
      <div className="relative flex h-full flex-col">
        {/* ── Header (fixed) ── */}
        <header className="relative z-40 shrink-0 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            {/* Left: hamburger (mobile) + logo + welcome info */}
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted/50 md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
              >
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Brand logo */}
              <BrandLogo size="compact" />

              {/* Divider */}
              <div className="hidden h-6 w-px bg-border md:block" />

              {/* Welcome info (merged from welcome card) */}
              <div className="hidden min-w-0 md:block">
                <p className="truncate font-heading text-sm font-semibold text-foreground leading-tight">
                  Olá, {userFirstName}.
                </p>
                <p className="truncate font-body text-xs text-muted-foreground leading-tight">
                  {profileConfig.title}
                  {currentSection ? ` · ${currentSection.title}` : ""}
                </p>
              </div>

              {/* Mobile: just show current section title */}
              <h1 className="truncate font-heading text-sm font-semibold text-foreground md:hidden">
                {currentSection?.title ?? "RED"}
              </h1>
            </div>

            {/* Right: actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <NotificationBell />

              {/* Settings */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted/50"
                aria-label="Configurações"
              >
                <Settings size={15} />
              </button>

              {/* Theme toggle */}
              <ThemeToggleButton compact />
              {/* Notifications */}

              {/* Logout */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-brand px-3 text-xs font-heading font-semibold text-white transition-colors hover:bg-red-brand-dark"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Body row (sidebar + main) — fills remaining height ── */}
        <div className="flex min-h-0 flex-1">
          {/* ── Desktop sidebar (fixed height, scrollable nav) ── */}
          <aside
            className={`hidden shrink-0 flex-col border-r border-border bg-card/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex ${
              isSidebarCollapsed ? "w-[4.5rem]" : "w-64"
            }`}
          >
            {/* ── Profile badge ── */}
            <div className="shrink-0 border-b border-border px-3 py-3">
              <div
                className={`flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-br ${accentGradient} px-3 shadow-md ${
                  isSidebarCollapsed ? "justify-center py-2.5" : "py-2.5"
                }`}
              >
                {/* Avatar circle */}
                <div className="shrink-0 inline-flex size-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
                  {userInitials}
                </div>
                {/* Name + role */}
                {!isSidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xs font-semibold text-white leading-tight">
                      {userFirstName}
                    </p>
                    <p className="truncate font-body text-[10px] text-white/75 leading-tight">
                      {profileConfig.title}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Scrollable nav ── */}
            <nav
              className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/40"
              role="navigation"
              aria-label="Menu principal"
            >
              <div className="space-y-0.5">
                {sections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <motion.button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex w-full items-center gap-2.5 overflow-hidden rounded-lg border text-left transition-all duration-150 ${
                        isSidebarCollapsed
                          ? "justify-center px-0 py-2.5"
                          : "px-2.5 py-2"
                      } ${
                        isActive
                          ? "border-red-brand/20 bg-red-brand/10 text-red-brand"
                          : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                      title={section.title}
                    >
                      <motion.div
                        animate={{ scale: isActive ? 1.1 : 1 }}
                        transition={{ duration: 0.12, ease: "backOut" }}
                        className="shrink-0"
                      >
                        <Icon size={isSidebarCollapsed ? 19 : 16} />
                      </motion.div>
                      {!isSidebarCollapsed && (
                        <span className="block truncate font-heading text-sm font-medium">
                          {section.title}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </nav>

            {/* ── Sidebar footer: collapse toggle + logout ── */}
            <div className="shrink-0 border-t border-border p-2 space-y-1">
              {/* Logout */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className={`inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-heading text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground ${
                  isSidebarCollapsed ? "justify-center" : ""
                }`}
                title="Sair"
              >
                <LogOut size={14} />
                {!isSidebarCollapsed && <span>Sair</span>}
              </button>

              {/* Collapse toggle — subtle icon-only button */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(prev => !prev)}
                className={`inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-muted-foreground ${
                  isSidebarCollapsed ? "justify-center" : ""
                }`}
                title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                aria-label={
                  isSidebarCollapsed ? "Expandir menu" : "Recolher menu"
                }
              >
                <motion.div
                  animate={{ rotate: isSidebarCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronLeft size={14} />
                  )}
                </motion.div>
                {!isSidebarCollapsed && (
                  <span className="font-body text-[11px]">Recolher</span>
                )}
              </button>
            </div>
          </aside>

          {/* ── Main scrollable area ── */}
          <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-4">
            {/* Mobile: profile pill + horizontal scroll tabs */}
            <div className="space-y-2 px-4 pt-4 md:hidden">
              <div
                className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${accentGradient} px-3 py-1.5`}
              >
                <div className="inline-flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                  {userInitials}
                </div>
                <span className="font-heading text-xs font-semibold text-white">
                  {profileConfig.title}
                </span>
              </div>
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {sections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-heading font-medium transition-colors ${
                        isActive
                          ? "border-red-brand bg-red-brand text-white"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon size={12} />
                      {section.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 lg:p-8">
              <AnimatePresence mode="wait" initial={false}>
                {currentSection ? (
                  <motion.div
                    key={`workspace-${currentSection.id}`}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Suspense fallback={<ContentLoader />}>
                      {SectionComponent && <SectionComponent />}
                    </Suspense>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav
        sections={sections}
        activeSection={activeSection}
        onSelect={setActiveSection}
        onMoreClick={() => setMobileMoreOpen(true)}
      />

      {/* ── Mobile "Mais" drawer ── */}
      <MobileMoreDrawer
        sections={sections}
        activeSection={activeSection}
        onSelect={setActiveSection}
        open={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
      />

      {/* ── Mobile hamburger overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.aside
              className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card/95 shadow-xl"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg bg-gradient-to-br ${accentGradient} shadow-sm`}
                  >
                    <School className="size-4 text-white" />
                  </div>
                  <span className="font-heading text-sm font-bold tracking-tight">
                    RED
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted/50"
                  aria-label="Fechar menu"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile badge */}
              <div className="shrink-0 border-b border-border p-3">
                <div
                  className={`flex items-center gap-2.5 rounded-xl bg-gradient-to-br ${accentGradient} px-3 py-2.5 shadow-md`}
                >
                  <div className="shrink-0 inline-flex size-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xs font-semibold text-white leading-tight">
                      {userFirstName}
                    </p>
                    <p className="truncate font-body text-[10px] text-white/75 leading-tight">
                      {profileConfig.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto p-2">
                <div className="space-y-0.5">
                  {sections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(section.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border-red-brand/20 bg-red-brand/10 text-red-brand"
                            : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="truncate font-heading text-sm font-medium">
                          {section.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="shrink-0 border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-heading text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings modal ── */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export type { DashboardSection, RegistryRow };
