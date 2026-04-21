import BrandTitleLogo from "@/components/BrandTitleLogo";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { useAuth } from "@/core/hooks/useAuth";
import {
  getProfileConfig,
  isUserProfile,
  type UserProfile,
} from "@/lib/profiles";
import { trpc } from "@/lib/trpc";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bell,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutGrid,
  LogOut,
  MessageSquare,
  School,
  Settings,
  ShieldCheck,
  UserRoundSearch,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type RegistryRow = Record<string, unknown>;

type DashboardSection = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type SchoolEventType =
  | "prova"
  | "feriado"
  | "saida_antecipada"
  | "evento_escolar"
  | "reuniao";

type CommunicationType = "announcement" | "reminder" | "alert";

type AttendanceStatus = "present" | "absent" | "justified";

type CommentCategory = "elogio" | "melhoria" | "ocorrencia" | "comentario";

type CommentVisibility = "student" | "guardian" | "school" | "all";

const LEGACY_PROFILE_BY_PATH: Record<string, UserProfile> = {
  "/teacher-dashboard": "teacher",
  "/student-dashboard": "student",
  "/guardian-dashboard": "guardian",
};

const PROFILE_BY_ROLE: Record<string, UserProfile> = {
  admin: "school",
  school_staff: "school",
  teacher: "teacher",
  student: "student",
  guardian: "guardian",
};

const PROFILE_SECTIONS: Record<UserProfile, DashboardSection[]> = {
  school: [
    {
      id: "overview",
      title: "Visao geral",
      description: "Resumo da operacao institucional.",
      icon: LayoutGrid,
    },
    {
      id: "students",
      title: "Alunos",
      description: "Cadastro e acompanhamento de estudantes.",
      icon: GraduationCap,
    },
    {
      id: "events",
      title: "Eventos",
      description: "Calendario escolar e avisos oficiais.",
      icon: CalendarClock,
    },
    {
      id: "communications",
      title: "Comunicados",
      description: "Mensagens para a comunidade escolar.",
      icon: MessageSquare,
    },
    {
      id: "contacts",
      title: "Contatos",
      description: "Interessados e solicitacoes recebidas.",
      icon: UserRoundSearch,
    },
  ],
  teacher: [
    {
      id: "overview",
      title: "Visao geral",
      description: "Resumo das turmas e do dia letivo.",
      icon: LayoutGrid,
    },
    {
      id: "attendance",
      title: "Frequencia",
      description: "Registro rapido de faltas e presencas.",
      icon: ClipboardList,
    },
    {
      id: "comments",
      title: "Comentarios",
      description: "Ocorrencias, elogios e pontos de melhoria.",
      icon: FileText,
    },
    {
      id: "grades",
      title: "Desempenho",
      description: "Lancamento e atualizacao de notas.",
      icon: BookOpenCheck,
    },
  ],
  student: [
    {
      id: "overview",
      title: "Meu resumo",
      description: "Situacao atual de desempenho e faltas.",
      icon: LayoutGrid,
    },
    {
      id: "grades",
      title: "Notas",
      description: "Historico de avaliacao por disciplina.",
      icon: BookOpenCheck,
    },
    {
      id: "comments",
      title: "Comentarios",
      description: "Feedback pedagógico sem identificacao de autor.",
      icon: FileText,
    },
    {
      id: "communications",
      title: "Comunicados",
      description: "Avisos da escola e dos professores.",
      icon: Bell,
    },
  ],
  guardian: [
    {
      id: "students",
      title: "Dependentes",
      description: "Selecione o aluno para consultar.",
      icon: Users,
    },
    {
      id: "performance",
      title: "Desempenho",
      description: "Notas e faltas por aluno.",
      icon: BookOpenCheck,
    },
    {
      id: "comments",
      title: "Comentarios",
      description: "Ocorrencias e observacoes com autoria.",
      icon: MessageSquare,
    },
    {
      id: "events",
      title: "Eventos",
      description: "Agenda escolar e comunicados oficiais.",
      icon: CalendarClock,
    },
  ],
};

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Presente",
  absent: "Falta",
  justified: "Falta justificada",
};

const COMMENT_CATEGORY_LABELS: Record<CommentCategory, string> = {
  elogio: "Elogio",
  melhoria: "Melhoria",
  ocorrencia: "Ocorrencia",
  comentario: "Comentario",
};

const EVENT_TYPE_LABELS: Record<SchoolEventType, string> = {
  prova: "Prova",
  feriado: "Feriado",
  saida_antecipada: "Saida antecipada",
  evento_escolar: "Evento escolar",
  reuniao: "Reuniao",
};

const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  announcement: "Comunicado",
  reminder: "Lembrete",
  alert: "Alerta",
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

function asRows(value: unknown): RegistryRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is RegistryRow => typeof entry === "object" && entry !== null
  );
}

function asRecord(value: unknown): RegistryRow {
  if (typeof value === "object" && value !== null) {
    return value as RegistryRow;
  }
  return {};
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function toDateLabel(value: unknown): string {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function toDateTimeLabel(value: unknown): string {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function parseNumberFromText(value: string): string {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed)) return "";
  return parsed.toFixed(2);
}

function StatCard({
  title,
  value,
  icon: Icon,
  accentClassName,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accentClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accentClassName}`}
        >
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function SectionPanel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-brand text-white">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="font-body text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
      <Icon size={26} className="mx-auto mb-2 text-muted-foreground" />
      <p className="font-heading text-base font-semibold text-foreground">
        {title}
      </p>
      <p className="mt-1 font-body text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roleProfile = useMemo(
    () => resolveProfileFromRole(user?.role),
    [user?.role]
  );

  const hasExplicitDefaultProfile = isUserProfile(user?.defaultProfile);
  const shouldInferProfile =
    Boolean(user?.id) &&
    isAuthenticated &&
    !loading &&
    !hasExplicitDefaultProfile &&
    !roleProfile;

  const userSchoolLinksQuery = trpc.registry.list.useQuery(
    {
      entity: "userSchools",
      filters: { userId: user?.id ?? 0 },
      limit: 30,
      offset: 0,
      orderDirection: "desc",
    },
    {
      enabled: shouldInferProfile,
      retry: false,
    }
  );

  const teacherProfileProbeQuery = trpc.profiles.teacher.me.useQuery(
    undefined,
    {
      enabled: shouldInferProfile,
      retry: false,
    }
  );

  const studentProfileProbeQuery = trpc.profiles.student.me.useQuery(
    undefined,
    {
      enabled: shouldInferProfile,
      retry: false,
    }
  );

  const guardianProfileProbeQuery = trpc.profiles.guardian.me.useQuery(
    undefined,
    {
      enabled: shouldInferProfile,
      retry: false,
    }
  );

  const isResolvingProfile =
    shouldInferProfile &&
    (userSchoolLinksQuery.isLoading ||
      teacherProfileProbeQuery.isLoading ||
      studentProfileProbeQuery.isLoading ||
      guardianProfileProbeQuery.isLoading);

  const inferredProfile = useMemo<UserProfile | null>(() => {
    const inferredProfiles = new Set<UserProfile>();
    const userSchoolLinks = asRows(userSchoolLinksQuery.data);

    const hasSchoolManagementRole = userSchoolLinks.some(link => {
      const role = toText(link.role);
      return role === "admin" || role === "director" || role === "coordinator";
    });

    if (hasSchoolManagementRole) {
      inferredProfiles.add("school");
    }

    if (teacherProfileProbeQuery.data) {
      inferredProfiles.add("teacher");
    }

    if (studentProfileProbeQuery.data) {
      inferredProfiles.add("student");
    }

    if (guardianProfileProbeQuery.data) {
      inferredProfiles.add("guardian");
    }

    for (const profile of [
      "school",
      "teacher",
      "student",
      "guardian",
    ] as const) {
      if (inferredProfiles.has(profile)) {
        return profile;
      }
    }

    return null;
  }, [
    guardianProfileProbeQuery.data,
    studentProfileProbeQuery.data,
    teacherProfileProbeQuery.data,
    userSchoolLinksQuery.data,
  ]);

  const enforcedProfile = useMemo<UserProfile>(() => {
    if (isUserProfile(user?.defaultProfile)) {
      return user.defaultProfile;
    }

    if (roleProfile) {
      return roleProfile;
    }

    if (inferredProfile) {
      return inferredProfile;
    }

    return "school";
  }, [inferredProfile, roleProfile, user?.defaultProfile]);

  const [activeProfile, setActiveProfile] =
    useState<UserProfile>(enforcedProfile);
  const [activeSection, setActiveSection] = useState<string>(() =>
    getFirstSectionId(enforcedProfile)
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    setActiveProfile(previous =>
      previous === enforcedProfile ? previous : enforcedProfile
    );
  }, [enforcedProfile]);

  useEffect(() => {
    setActiveSection(current => {
      const availableSections = PROFILE_SECTIONS[activeProfile].map(
        section => section.id
      );
      if (availableSections.includes(current)) return current;
      return availableSections[0] ?? "overview";
    });
  }, [activeProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isResolvingProfile) return;

    const params = new URLSearchParams(window.location.search);
    const hasLegacyPath =
      LEGACY_PROFILE_BY_PATH[window.location.pathname] !== undefined;
    const shouldNormalizePath =
      hasLegacyPath || window.location.pathname !== "/dashboard";
    const shouldNormalizeProfile = params.get("profile") !== activeProfile;

    if (!shouldNormalizePath && !shouldNormalizeProfile) {
      return;
    }

    params.set("profile", activeProfile);
    navigate(`/dashboard?${params.toString()}`);
  }, [activeProfile, isResolvingProfile, location, navigate]);

  useEffect(() => {
    if (isResolvingProfile) return;
    sessionStorage.setItem("selectedProfile", activeProfile);
  }, [activeProfile, isResolvingProfile]);

  const profileConfig = getProfileConfig(activeProfile);
  const profileSections = PROFILE_SECTIONS[activeProfile];
  const currentSection =
    profileSections.find(section => section.id === activeSection) ??
    profileSections[0];

  const userFirstName = (user?.name ?? "Usuário").split(" ")[0] ?? "Usuário";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/");
    } catch (_error) {
      toast.error("Nao foi possivel finalizar a sessao.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-foreground">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isResolvingProfile) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-foreground">
            Validando perfil de acesso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <BrandTitleLogo size="compact" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate font-heading text-sm font-semibold text-foreground">
                Dashboard unificado RED
              </p>
              <p className="truncate font-body text-xs text-muted-foreground">
                {profileConfig.title} • {currentSection?.title ?? "Visao geral"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-body text-muted-foreground md:inline-flex">
              {profileConfig.title}
            </span>
            <button
              type="button"
              onClick={() => toast.info("Configuracoes em desenvolvimento.")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted/50"
              aria-label="Abrir configuracoes"
            >
              <Settings size={16} />
            </button>
            <ThemeToggleButton compact />
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-lg bg-red-brand px-3 py-2 text-xs font-heading font-semibold text-white transition-colors hover:bg-red-brand-dark disabled:opacity-70 sm:text-sm"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card/80 md:flex md:flex-col">
          <div className="border-b border-border p-4">
            <p className="mb-3 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Perfil ativo
            </p>
            <div className="rounded-lg border border-red-brand bg-red-brand px-3 py-3 text-white">
              <span className="block font-heading text-sm font-semibold">
                {profileConfig.title}
              </span>
              <span className="mt-1 block font-body text-xs text-white/90">
                Acesso bloqueado para o perfil autorizado.
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {profileSections.map(section => {
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-red-brand bg-red-brand text-white"
                      : "border-transparent hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <section.icon size={18} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-heading text-sm font-semibold">
                      {section.title}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        active ? "text-white/85" : "text-muted-foreground"
                      }`}
                    >
                      {section.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <p className="font-body text-xs text-muted-foreground">
              {profileConfig.description}
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <div className="mb-5 space-y-3 md:hidden">
            <div className="rounded-lg border border-red-brand bg-red-brand px-3 py-2 text-sm font-heading font-semibold text-white">
              Perfil autorizado: {profileConfig.title}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {profileSections.map(section => {
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-body ${
                      active
                        ? "border-red-brand bg-red-brand text-white"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {section.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {profileConfig.title}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
              Ola, {userFirstName}.
            </h1>
            <p className="mt-2 max-w-3xl font-body text-sm text-muted-foreground">
              Estrutura unica de trabalho: header padrao, menu lateral por
              perfil e conteudo dinâmico por secao para uma rotina escolar
              organizada.
            </p>
          </div>

          <ProfileWorkspace
            profile={activeProfile}
            sectionId={currentSection?.id ?? getFirstSectionId(activeProfile)}
            userId={user?.id ?? 0}
          />
        </main>
      </div>
    </div>
  );
}

function ProfileWorkspace({
  profile,
  sectionId,
  userId,
}: {
  profile: UserProfile;
  sectionId: string;
  userId: number;
}) {
  if (profile === "teacher") {
    return <TeacherWorkspace sectionId={sectionId} userId={userId} />;
  }

  if (profile === "student") {
    return <StudentWorkspace sectionId={sectionId} />;
  }

  if (profile === "guardian") {
    return <GuardianWorkspace sectionId={sectionId} userId={userId} />;
  }

  return <SchoolWorkspace sectionId={sectionId} userId={userId} />;
}

function SchoolWorkspace({
  sectionId,
  userId,
}: {
  sectionId: string;
  userId: number;
}) {
  const utils = trpc.useUtils();
  const mySchoolsQuery = trpc.schools.mySchools.useQuery();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  const studentsQuery = trpc.registry.list.useQuery(
    selectedSchoolId
      ? {
          entity: "students",
          filters: { schoolId: selectedSchoolId },
          limit: 200,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "students",
          limit: 200,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        },
    { enabled: Boolean(selectedSchoolId) }
  );

  const guardiansQuery = trpc.registry.list.useQuery(
    selectedSchoolId
      ? {
          entity: "guardians",
          filters: { schoolId: selectedSchoolId },
          limit: 200,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "guardians",
          limit: 200,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        },
    { enabled: Boolean(selectedSchoolId) }
  );

  const eventsQuery = trpc.registry.list.useQuery(
    selectedSchoolId
      ? {
          entity: "schoolEvents",
          filters: { schoolId: selectedSchoolId },
          limit: 200,
          offset: 0,
          orderBy: "startsAt",
          orderDirection: "desc",
        }
      : {
          entity: "schoolEvents",
          limit: 200,
          offset: 0,
          orderBy: "startsAt",
          orderDirection: "desc",
        },
    { enabled: Boolean(selectedSchoolId) }
  );

  const communicationsQuery = trpc.registry.list.useQuery(
    selectedSchoolId
      ? {
          entity: "communications",
          filters: { schoolId: selectedSchoolId },
          limit: 200,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "communications",
          limit: 200,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        },
    { enabled: Boolean(selectedSchoolId) }
  );

  const contactsQuery = trpc.schools.contacts.useQuery(
    { schoolId: selectedSchoolId ?? 0 },
    { enabled: Boolean(selectedSchoolId) }
  );

  const createRegistryMutation = trpc.registry.create.useMutation();

  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState<SchoolEventType>("evento_escolar");
  const [eventDate, setEventDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [communicationTitle, setCommunicationTitle] = useState("");
  const [communicationBody, setCommunicationBody] = useState("");
  const [communicationType, setCommunicationType] =
    useState<CommunicationType>("announcement");
  const [relatedEventId, setRelatedEventId] = useState("");

  useEffect(() => {
    if (selectedSchoolId || !mySchoolsQuery.data?.length) return;
    setSelectedSchoolId(mySchoolsQuery.data[0].schoolId);
  }, [mySchoolsQuery.data, selectedSchoolId]);

  const schoolRows = mySchoolsQuery.data ?? [];
  const selectedSchool = schoolRows.find(
    school => school.schoolId === selectedSchoolId
  )?.school;

  const studentRows = asRows(studentsQuery.data);
  const guardianRows = asRows(guardiansQuery.data);
  const eventRows = asRows(eventsQuery.data);
  const communicationRows = asRows(communicationsQuery.data);
  const schoolContacts = contactsQuery.data ?? [];

  const handleCreateStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSchoolId) {
      toast.error("Selecione uma escola primeiro.");
      return;
    }

    if (!studentName.trim()) {
      toast.error("Informe o nome do aluno.");
      return;
    }

    try {
      await createRegistryMutation.mutateAsync({
        entity: "students",
        data: {
          schoolId: selectedSchoolId,
          name: studentName.trim(),
          grade: studentGrade.trim() || null,
          email: studentEmail.trim() || null,
          status: "ativo",
        },
      });

      setStudentName("");
      setStudentGrade("");
      setStudentEmail("");
      toast.success("Aluno cadastrado com sucesso.");
      await utils.registry.list.invalidate();
    } catch (_error) {
      toast.error("Nao foi possivel cadastrar o aluno.");
    }
  };

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSchoolId) {
      toast.error("Selecione uma escola primeiro.");
      return;
    }

    if (!eventTitle.trim()) {
      toast.error("Informe o titulo do evento.");
      return;
    }

    try {
      const startsAt = new Date(`${eventDate}T07:30:00`).toISOString();

      const createdEvent = await createRegistryMutation.mutateAsync({
        entity: "schoolEvents",
        data: {
          schoolId: selectedSchoolId,
          title: eventTitle.trim(),
          description: eventDescription.trim() || null,
          eventType,
          startsAt,
          createdByUserId: userId || null,
        },
      });

      const createdEventId = toNumber(asRecord(createdEvent).id);
      if (createdEventId) {
        await createRegistryMutation.mutateAsync({
          entity: "eventTargets",
          data: {
            eventId: createdEventId,
            targetType: "school",
            targetRefId: selectedSchoolId,
          },
        });
      }

      setEventTitle("");
      setEventDescription("");
      toast.success("Evento criado e publicado.");
      await utils.registry.list.invalidate();
    } catch (_error) {
      toast.error("Nao foi possivel criar o evento.");
    }
  };

  const handleCreateCommunication = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedSchoolId) {
      toast.error("Selecione uma escola primeiro.");
      return;
    }

    if (!communicationTitle.trim() || !communicationBody.trim()) {
      toast.error("Informe titulo e conteudo do comunicado.");
      return;
    }

    try {
      const createdCommunication = await createRegistryMutation.mutateAsync({
        entity: "communications",
        data: {
          schoolId: selectedSchoolId,
          authorUserId: userId || null,
          title: communicationTitle.trim(),
          body: communicationBody.trim(),
          communicationType,
          relatedEventId: relatedEventId ? Number(relatedEventId) : null,
        },
      });

      const communicationId = toNumber(asRecord(createdCommunication).id);

      if (communicationId) {
        for (const guardian of guardianRows) {
          const guardianId = toNumber(guardian.id);
          if (!guardianId) continue;

          await createRegistryMutation.mutateAsync({
            entity: "communicationRecipients",
            data: {
              communicationId,
              recipientType: "guardian",
              recipientRefId: guardianId,
            },
          });
        }
      }

      setCommunicationTitle("");
      setCommunicationBody("");
      setRelatedEventId("");
      toast.success("Comunicado enviado para os responsaveis.");
      await utils.registry.list.invalidate();
    } catch (_error) {
      toast.error("Nao foi possivel enviar o comunicado.");
    }
  };

  if (mySchoolsQuery.isLoading) {
    return (
      <SectionPanel
        title="Carregando escolas"
        description="Buscando unidades vinculadas ao seu usuario."
        icon={School}
      >
        <p className="font-body text-sm text-muted-foreground">
          Aguarde alguns instantes...
        </p>
      </SectionPanel>
    );
  }

  if (!schoolRows.length) {
    return (
      <EmptyState
        icon={School}
        title="Nenhuma escola vinculada"
        description="Associe sua conta a uma unidade escolar para administrar alunos, eventos e comunicados."
      />
    );
  }

  const section = sectionId;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-2 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Escola ativa
        </p>
        <div className="flex flex-wrap gap-2">
          {schoolRows.map(row => {
            const active = row.schoolId === selectedSchoolId;
            return (
              <button
                key={row.schoolId}
                type="button"
                onClick={() => setSelectedSchoolId(row.schoolId)}
                className={`rounded-lg border px-3 py-2 text-sm font-heading font-semibold ${
                  active
                    ? "border-red-brand bg-red-brand text-white"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                {row.school.name}
              </button>
            );
          })}
        </div>
      </div>

      {section === "overview" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Alunos"
              value={String(studentRows.length)}
              icon={GraduationCap}
              accentClassName="bg-red-brand"
            />
            <StatCard
              title="Responsaveis"
              value={String(guardianRows.length)}
              icon={Users}
              accentClassName="bg-blue-brand"
            />
            <StatCard
              title="Eventos"
              value={String(eventRows.length)}
              icon={CalendarClock}
              accentClassName="bg-red-brand"
            />
            <StatCard
              title="Contatos"
              value={String(schoolContacts.length)}
              icon={MessageSquare}
              accentClassName="bg-blue-brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionPanel
              title="Resumo institucional"
              description="Dados centrais da escola ativa."
              icon={ShieldCheck}
            >
              <div className="space-y-2 text-sm">
                <p className="font-body text-muted-foreground">
                  <strong className="text-foreground">Nome:</strong>{" "}
                  {selectedSchool?.name ?? "-"}
                </p>
                <p className="font-body text-muted-foreground">
                  <strong className="text-foreground">Email:</strong>{" "}
                  {selectedSchool?.email ?? "-"}
                </p>
                <p className="font-body text-muted-foreground">
                  <strong className="text-foreground">Cidade:</strong>{" "}
                  {selectedSchool?.city ?? "-"}
                </p>
                <p className="font-body text-muted-foreground">
                  <strong className="text-foreground">Status:</strong>{" "}
                  {toText(selectedSchool?.status) || "-"}
                </p>
              </div>
            </SectionPanel>

            <SectionPanel
              title="Ultimos eventos"
              description="Agenda criada pelo nucleo gestor."
              icon={CalendarClock}
            >
              {eventRows.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Sem eventos publicados"
                  description="Crie eventos para provas, reunioes e comunicados gerais."
                />
              ) : (
                <div className="space-y-3">
                  {eventRows.slice(0, 5).map(eventRow => (
                    <div
                      key={toText(eventRow.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {toText(eventRow.title) || "Evento sem titulo"}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {EVENT_TYPE_LABELS[
                          (toText(eventRow.eventType) as SchoolEventType) ||
                            "evento_escolar"
                        ] || "Evento"}{" "}
                        • {toDateTimeLabel(eventRow.startsAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>
          </div>
        </>
      ) : null}

      {section === "students" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Cadastrar aluno"
            description="Entrada rapida de novos estudantes no sistema."
            icon={GraduationCap}
          >
            <form className="space-y-3" onSubmit={handleCreateStudent}>
              <input
                type="text"
                value={studentName}
                onChange={event => setStudentName(event.target.value)}
                placeholder="Nome completo do aluno"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={studentGrade}
                onChange={event => setStudentGrade(event.target.value)}
                placeholder="Serie/Turma (ex.: 6o Ano A)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={studentEmail}
                onChange={event => setStudentEmail(event.target.value)}
                placeholder="Email do aluno (opcional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={createRegistryMutation.isPending}
                className="rounded-lg bg-red-brand px-4 py-2 text-sm font-heading font-semibold text-white disabled:opacity-70"
              >
                {createRegistryMutation.isPending
                  ? "Salvando..."
                  : "Adicionar aluno"}
              </button>
            </form>
          </SectionPanel>

          <SectionPanel
            title="Alunos cadastrados"
            description="Base de estudantes da escola selecionada."
            icon={Users}
          >
            {studentsQuery.isLoading ? (
              <p className="font-body text-sm text-muted-foreground">
                Carregando alunos...
              </p>
            ) : studentRows.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum aluno cadastrado"
                description="Utilize o formulario ao lado para iniciar a base de dados dos estudantes."
              />
            ) : (
              <div className="space-y-2">
                {studentRows.slice(0, 14).map(student => (
                  <div
                    key={toText(student.id)}
                    className="rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <p className="font-heading font-semibold text-foreground">
                      {toText(student.name) || "Aluno sem nome"}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {toText(student.grade) || "Serie nao informada"}
                      {toText(student.email)
                        ? ` • ${toText(student.email)}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}

      {section === "events" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Criar evento escolar"
            description="Provas, feriados, saidas antecipadas e reunioes."
            icon={CalendarClock}
          >
            <form className="space-y-3" onSubmit={handleCreateEvent}>
              <input
                type="text"
                value={eventTitle}
                onChange={event => setEventTitle(event.target.value)}
                placeholder="Titulo do evento"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={eventType}
                onChange={event =>
                  setEventType(event.target.value as SchoolEventType)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={eventDate}
                onChange={event => setEventDate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={eventDescription}
                onChange={event => setEventDescription(event.target.value)}
                placeholder="Descricao (opcional)"
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={createRegistryMutation.isPending}
                className="rounded-lg bg-red-brand px-4 py-2 text-sm font-heading font-semibold text-white disabled:opacity-70"
              >
                {createRegistryMutation.isPending
                  ? "Publicando..."
                  : "Publicar evento"}
              </button>
            </form>
          </SectionPanel>

          <SectionPanel
            title="Agenda da escola"
            description="Linha do tempo dos eventos publicados."
            icon={CalendarClock}
          >
            {eventsQuery.isLoading ? (
              <p className="font-body text-sm text-muted-foreground">
                Carregando agenda...
              </p>
            ) : eventRows.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Sem eventos"
                description="Os eventos criados aparecem aqui automaticamente."
              />
            ) : (
              <div className="space-y-3">
                {eventRows.map(eventRow => {
                  const type =
                    (toText(eventRow.eventType) as SchoolEventType) ||
                    "evento_escolar";
                  return (
                    <div
                      key={toText(eventRow.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {toText(eventRow.title) || "Evento"}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {EVENT_TYPE_LABELS[type]} •{" "}
                        {toDateTimeLabel(eventRow.startsAt)}
                      </p>
                      {toText(eventRow.description) ? (
                        <p className="mt-1 font-body text-sm text-muted-foreground">
                          {toText(eventRow.description)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}

      {section === "communications" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Enviar comunicado"
            description="Mensagem institucional para responsaveis da escola."
            icon={MessageSquare}
          >
            <form className="space-y-3" onSubmit={handleCreateCommunication}>
              <input
                type="text"
                value={communicationTitle}
                onChange={event => setCommunicationTitle(event.target.value)}
                placeholder="Titulo do comunicado"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={communicationType}
                onChange={event =>
                  setCommunicationType(event.target.value as CommunicationType)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(COMMUNICATION_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
              <select
                value={relatedEventId}
                onChange={event => setRelatedEventId(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Sem evento relacionado</option>
                {eventRows.map(eventRow => (
                  <option key={toText(eventRow.id)} value={toText(eventRow.id)}>
                    {toText(eventRow.title) || "Evento"}
                  </option>
                ))}
              </select>
              <textarea
                value={communicationBody}
                onChange={event => setCommunicationBody(event.target.value)}
                placeholder="Conteudo do comunicado"
                rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={createRegistryMutation.isPending}
                className="rounded-lg bg-red-brand px-4 py-2 text-sm font-heading font-semibold text-white disabled:opacity-70"
              >
                {createRegistryMutation.isPending
                  ? "Enviando..."
                  : "Enviar comunicado"}
              </button>
            </form>
          </SectionPanel>

          <SectionPanel
            title="Historico de comunicados"
            description="Mensagens enviadas para a comunidade escolar."
            icon={Bell}
          >
            {communicationsQuery.isLoading ? (
              <p className="font-body text-sm text-muted-foreground">
                Carregando comunicados...
              </p>
            ) : communicationRows.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Nenhum comunicado"
                description="Os comunicados enviados aparecerao nesta area."
              />
            ) : (
              <div className="space-y-3">
                {communicationRows.map(communication => {
                  const communicationTypeValue =
                    (toText(
                      communication.communicationType
                    ) as CommunicationType) || "announcement";

                  return (
                    <div
                      key={toText(communication.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-heading font-semibold text-foreground">
                          {toText(communication.title) || "Comunicado"}
                        </p>
                        <span className="rounded-full bg-red-brand/10 px-2 py-1 text-[11px] font-body text-red-brand">
                          {COMMUNICATION_TYPE_LABELS[communicationTypeValue]}
                        </span>
                      </div>
                      <p className="mt-1 font-body text-sm text-muted-foreground">
                        {toText(communication.body)}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        {toDateTimeLabel(communication.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}

      {section === "contacts" ? (
        <SectionPanel
          title="Contatos recebidos"
          description="Pessoas interessadas que entraram em contato com a escola."
          icon={UserRoundSearch}
        >
          {contactsQuery.isLoading ? (
            <p className="font-body text-sm text-muted-foreground">
              Carregando contatos...
            </p>
          ) : schoolContacts.length === 0 ? (
            <EmptyState
              icon={UserRoundSearch}
              title="Sem contatos"
              description="Quando novos formularios forem enviados, os registros aparecerao aqui."
            />
          ) : (
            <div className="space-y-3">
              {schoolContacts.map(contact => (
                <div
                  key={contact.id}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-heading font-semibold text-foreground">
                        {contact.name}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {contact.email} • {contact.role}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-brand/10 px-2 py-1 text-[11px] font-body text-blue-brand">
                      {contact.status}
                    </span>
                  </div>
                  {contact.message ? (
                    <p className="mt-2 font-body text-sm text-muted-foreground">
                      {contact.message}
                    </p>
                  ) : null}
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    {toDateLabel(contact.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      ) : null}
    </div>
  );
}

function TeacherWorkspace({
  sectionId,
  userId,
}: {
  sectionId: string;
  userId: number;
}) {
  const utils = trpc.useUtils();

  const teacherProfileQuery = trpc.profiles.teacher.me.useQuery(undefined, {
    retry: false,
  });
  const classesSummaryQuery = trpc.profiles.teacher.classes.useQuery(
    undefined,
    {
      retry: false,
    }
  );

  const teacherRecordQuery = trpc.registry.list.useQuery({
    entity: "teachers",
    filters: { userId },
    limit: 1,
    offset: 0,
    orderDirection: "desc",
  });

  const teacherRecord = asRows(teacherRecordQuery.data)[0] ?? null;
  const teacherId = toNumber(teacherRecord?.id);
  const schoolId = toNumber(teacherRecord?.schoolId);

  const classRowsQuery = trpc.registry.list.useQuery(
    schoolId
      ? {
          entity: "classes",
          filters: { schoolId },
          limit: 200,
          offset: 0,
          orderBy: "name",
          orderDirection: "asc",
        }
      : {
          entity: "classes",
          limit: 200,
          offset: 0,
          orderBy: "name",
          orderDirection: "asc",
        },
    { enabled: Boolean(schoolId) }
  );

  const studentsQuery = trpc.registry.list.useQuery(
    schoolId
      ? {
          entity: "students",
          filters: { schoolId },
          limit: 500,
          offset: 0,
          orderBy: "name",
          orderDirection: "asc",
        }
      : {
          entity: "students",
          limit: 500,
          offset: 0,
          orderBy: "name",
          orderDirection: "asc",
        },
    { enabled: Boolean(schoolId) }
  );

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const enrollmentsQuery = trpc.registry.list.useQuery(
    selectedClassId
      ? {
          entity: "classEnrollments",
          filters: { classId: selectedClassId },
          limit: 500,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "classEnrollments",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(selectedClassId) }
  );

  const classSubjectsQuery = trpc.registry.list.useQuery(
    selectedClassId
      ? {
          entity: "classSubjects",
          filters: { classId: selectedClassId },
          limit: 20,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "classSubjects",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(selectedClassId) }
  );

  const commentsHistoryQuery = trpc.registry.list.useQuery(
    teacherId
      ? {
          entity: "studentComments",
          filters: { teacherId },
          limit: 50,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "studentComments",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(teacherId) }
  );

  const attendanceHistoryQuery = trpc.registry.list.useQuery(
    teacherId
      ? {
          entity: "attendanceRecords",
          filters: { recordedByTeacherId: teacherId },
          limit: 50,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "attendanceRecords",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(teacherId) }
  );

  const assessmentsHistoryQuery = trpc.registry.list.useQuery(
    teacherId
      ? {
          entity: "assessments",
          filters: { teacherId },
          limit: 50,
          offset: 0,
          orderBy: "assessmentDate",
          orderDirection: "desc",
        }
      : {
          entity: "assessments",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(teacherId) }
  );

  const createRegistryMutation = trpc.registry.create.useMutation();
  const updateRegistryMutation = trpc.registry.update.useMutation();

  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>("absent");
  const [attendanceReason, setAttendanceReason] = useState("");

  const [commentCategory, setCommentCategory] =
    useState<CommentCategory>("comentario");
  const [commentVisibility, setCommentVisibility] =
    useState<CommentVisibility>("guardian");
  const [commentContent, setCommentContent] = useState("");

  const [gradeTitle, setGradeTitle] = useState("Avaliacao continua");
  const [gradeDate, setGradeDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [gradeValue, setGradeValue] = useState("8,0");
  const [gradeFeedback, setGradeFeedback] = useState("");

  const classRows = asRows(classRowsQuery.data);
  const studentRows = asRows(studentsQuery.data);
  const enrollmentRows = asRows(enrollmentsQuery.data);
  const classSubjectRows = asRows(classSubjectsQuery.data);
  const commentRows = asRows(commentsHistoryQuery.data);
  const attendanceRows = asRows(attendanceHistoryQuery.data);
  const assessmentRows = asRows(assessmentsHistoryQuery.data);

  const enrolledStudentRows = useMemo(() => {
    const ids = new Set<number>();

    for (const enrollment of enrollmentRows) {
      const studentId = toNumber(enrollment.studentId);
      if (studentId) ids.add(studentId);
    }

    return studentRows.filter(student => {
      const studentId = toNumber(student.id);
      return studentId ? ids.has(studentId) : false;
    });
  }, [enrollmentRows, studentRows]);

  const classById = useMemo(() => {
    const map = new Map<number, string>();
    for (const classRow of classRows) {
      const id = toNumber(classRow.id);
      if (!id) continue;
      map.set(id, toText(classRow.name) || `Turma ${id}`);
    }
    return map;
  }, [classRows]);

  const studentById = useMemo(() => {
    const map = new Map<number, string>();
    for (const studentRow of studentRows) {
      const id = toNumber(studentRow.id);
      if (!id) continue;
      map.set(id, toText(studentRow.name) || `Aluno ${id}`);
    }
    return map;
  }, [studentRows]);

  const selectedClassSubjectId = toNumber(classSubjectRows[0]?.id);

  useEffect(() => {
    if (selectedClassId || classRows.length === 0) return;
    const firstClassId = toNumber(classRows[0]?.id);
    if (firstClassId) setSelectedClassId(firstClassId);
  }, [classRows, selectedClassId]);

  useEffect(() => {
    if (enrolledStudentRows.length === 0) {
      setSelectedStudentId(null);
      return;
    }

    const selectedExists = enrolledStudentRows.some(
      student => toNumber(student.id) === selectedStudentId
    );

    if (!selectedExists) {
      const firstStudentId = toNumber(enrolledStudentRows[0]?.id);
      setSelectedStudentId(firstStudentId);
    }
  }, [enrolledStudentRows, selectedStudentId]);

  const handleSaveAttendance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!teacherId || !selectedClassSubjectId || !selectedStudentId) {
      toast.error("Selecione turma e aluno para registrar a frequencia.");
      return;
    }

    try {
      const existingSessions = asRows(
        await utils.registry.list.fetch({
          entity: "classSessions",
          filters: {
            classSubjectId: selectedClassSubjectId,
            lessonDate: attendanceDate,
            lessonNumber: 1,
          },
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        })
      );

      let classSessionId = toNumber(existingSessions[0]?.id);

      if (!classSessionId) {
        const createdSession = asRecord(
          await createRegistryMutation.mutateAsync({
            entity: "classSessions",
            data: {
              classSubjectId: selectedClassSubjectId,
              teacherId,
              lessonDate: attendanceDate,
              lessonNumber: 1,
              topic: "Registro de frequencia",
            },
          })
        );

        classSessionId = toNumber(createdSession.id);
      }

      if (!classSessionId) {
        toast.error("Nao foi possivel abrir a sessao da aula.");
        return;
      }

      const existingAttendance = asRows(
        await utils.registry.list.fetch({
          entity: "attendanceRecords",
          filters: {
            classSessionId,
            studentId: selectedStudentId,
          },
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        })
      );

      const attendanceId = toNumber(existingAttendance[0]?.id);

      if (attendanceId) {
        await updateRegistryMutation.mutateAsync({
          entity: "attendanceRecords",
          id: attendanceId,
          data: {
            status: attendanceStatus,
            reason: attendanceReason.trim() || null,
            recordedByTeacherId: teacherId,
          },
        });
      } else {
        await createRegistryMutation.mutateAsync({
          entity: "attendanceRecords",
          data: {
            classSessionId,
            studentId: selectedStudentId,
            status: attendanceStatus,
            reason: attendanceReason.trim() || null,
            recordedByTeacherId: teacherId,
          },
        });
      }

      setAttendanceReason("");
      toast.success("Frequencia registrada.");
      await utils.registry.list.invalidate();
    } catch (_error) {
      toast.error("Falha ao salvar frequencia.");
    }
  };

  const handleSaveComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!schoolId || !selectedStudentId || !commentContent.trim()) {
      toast.error("Preencha aluno e comentario antes de salvar.");
      return;
    }

    try {
      await createRegistryMutation.mutateAsync({
        entity: "studentComments",
        data: {
          schoolId,
          studentId: selectedStudentId,
          teacherId: teacherId || null,
          classSubjectId: selectedClassSubjectId || null,
          category: commentCategory,
          visibility: commentVisibility,
          content: commentContent.trim(),
        },
      });

      setCommentContent("");
      toast.success("Comentario registrado.");
      await utils.registry.list.invalidate();
    } catch (_error) {
      toast.error("Nao foi possivel registrar o comentario.");
    }
  };

  const handleSaveGrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedStudentId || !selectedClassSubjectId) {
      toast.error("Selecione turma e aluno para lancar a nota.");
      return;
    }

    if (!gradeTitle.trim()) {
      toast.error("Informe o titulo da avaliacao.");
      return;
    }

    const normalizedScore = parseNumberFromText(gradeValue);
    if (!normalizedScore) {
      toast.error("Informe uma nota valida.");
      return;
    }

    try {
      const existingAssessments = asRows(
        await utils.registry.list.fetch({
          entity: "assessments",
          filters: {
            classSubjectId: selectedClassSubjectId,
            title: gradeTitle.trim(),
            assessmentDate: gradeDate,
          },
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        })
      );

      let assessmentId = toNumber(existingAssessments[0]?.id);

      if (!assessmentId) {
        const createdAssessment = asRecord(
          await createRegistryMutation.mutateAsync({
            entity: "assessments",
            data: {
              classSubjectId: selectedClassSubjectId,
              teacherId: teacherId || null,
              title: gradeTitle.trim(),
              description: "Lancamento via painel docente",
              maxScore: "10.00",
              weight: "1.00",
              assessmentDate: gradeDate,
            },
          })
        );

        assessmentId = toNumber(createdAssessment.id);
      }

      if (!assessmentId) {
        toast.error("Nao foi possivel criar a avaliacao.");
        return;
      }

      const existingScores = asRows(
        await utils.registry.list.fetch({
          entity: "assessmentScores",
          filters: {
            assessmentId,
            studentId: selectedStudentId,
          },
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        })
      );

      const scoreId = toNumber(existingScores[0]?.id);

      if (scoreId) {
        await updateRegistryMutation.mutateAsync({
          entity: "assessmentScores",
          id: scoreId,
          data: {
            score: normalizedScore,
            feedback: gradeFeedback.trim() || null,
          },
        });
      } else {
        await createRegistryMutation.mutateAsync({
          entity: "assessmentScores",
          data: {
            assessmentId,
            studentId: selectedStudentId,
            score: normalizedScore,
            feedback: gradeFeedback.trim() || null,
          },
        });
      }

      setGradeFeedback("");
      toast.success("Nota registrada com sucesso.");
      await utils.registry.list.invalidate();
    } catch (_error) {
      toast.error("Falha ao salvar a nota.");
    }
  };

  if (teacherProfileQuery.isLoading || teacherRecordQuery.isLoading) {
    return (
      <SectionPanel
        title="Carregando painel docente"
        description="Buscando turmas e dados pedagogicos."
        icon={Users}
      >
        <p className="font-body text-sm text-muted-foreground">
          Aguarde alguns instantes...
        </p>
      </SectionPanel>
    );
  }

  if (!teacherRecord || !schoolId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Perfil de professor nao encontrado"
        description="Conclua o onboarding para liberar o uso de frequencia, comentarios e notas."
      />
    );
  }

  const section = sectionId;
  const classesSummary = classesSummaryQuery.data ?? [];

  return (
    <div className="space-y-6">
      {section === "overview" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Turmas"
              value={String(classRows.length)}
              icon={Users}
              accentClassName="bg-red-brand"
            />
            <StatCard
              title="Alunos ativos"
              value={String(enrolledStudentRows.length)}
              icon={GraduationCap}
              accentClassName="bg-blue-brand"
            />
            <StatCard
              title="Comentarios"
              value={String(commentRows.length)}
              icon={FileText}
              accentClassName="bg-red-brand"
            />
            <StatCard
              title="Registros de frequencia"
              value={String(attendanceRows.length)}
              icon={ClipboardList}
              accentClassName="bg-blue-brand"
            />
          </div>

          <SectionPanel
            title="Minhas turmas"
            description="Resumo das turmas atribuídas ao professor logado."
            icon={Users}
          >
            {classesSummary.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Sem turmas atribuidas"
                description="Associe turmas ao professor para iniciar os registros diarios."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {classesSummary.map(classSummary => (
                  <div
                    key={classSummary.id}
                    className="rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <p className="font-heading font-semibold text-foreground">
                      {classSummary.name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {classSummary.subject} • {classSummary.students} alunos
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </>
      ) : null}

      {section === "attendance" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Registrar frequencia"
            description="Lance faltas e presencas de forma rapida durante a aula."
            icon={ClipboardList}
          >
            <form className="space-y-3" onSubmit={handleSaveAttendance}>
              <select
                value={selectedClassId ?? ""}
                onChange={event =>
                  setSelectedClassId(toNumber(event.target.value) ?? null)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione a turma</option>
                {classRows.map(classRow => {
                  const classId = toNumber(classRow.id);
                  if (!classId) return null;
                  return (
                    <option key={classId} value={classId}>
                      {toText(classRow.name) || `Turma ${classId}`}
                    </option>
                  );
                })}
              </select>

              <select
                value={selectedStudentId ?? ""}
                onChange={event =>
                  setSelectedStudentId(toNumber(event.target.value) ?? null)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione o aluno</option>
                {enrolledStudentRows.map(studentRow => {
                  const studentId = toNumber(studentRow.id);
                  if (!studentId) return null;
                  return (
                    <option key={studentId} value={studentId}>
                      {toText(studentRow.name) || `Aluno ${studentId}`}
                    </option>
                  );
                })}
              </select>

              <input
                type="date"
                value={attendanceDate}
                onChange={event => setAttendanceDate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <select
                value={attendanceStatus}
                onChange={event =>
                  setAttendanceStatus(event.target.value as AttendanceStatus)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(ATTENDANCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <textarea
                value={attendanceReason}
                onChange={event => setAttendanceReason(event.target.value)}
                rows={3}
                placeholder="Observacao (opcional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={
                  createRegistryMutation.isPending ||
                  updateRegistryMutation.isPending
                }
                className="rounded-lg bg-red-brand px-4 py-2 text-sm font-heading font-semibold text-white disabled:opacity-70"
              >
                {createRegistryMutation.isPending ||
                updateRegistryMutation.isPending
                  ? "Salvando..."
                  : "Salvar frequencia"}
              </button>
            </form>
          </SectionPanel>

          <SectionPanel
            title="Historico de frequencia"
            description="Ultimos lancamentos realizados por voce."
            icon={CheckCircle2}
          >
            {attendanceRows.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sem registros"
                description="Os registros de frequencia aparecerao aqui apos o primeiro lancamento."
              />
            ) : (
              <div className="space-y-2">
                {attendanceRows.map(row => {
                  const studentId = toNumber(row.studentId);
                  const studentName = studentId
                    ? (studentById.get(studentId) ?? `Aluno ${studentId}`)
                    : "Aluno";
                  const status =
                    (toText(row.status) as AttendanceStatus) || "present";

                  return (
                    <div
                      key={toText(row.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {studentName}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {ATTENDANCE_LABELS[status]} •{" "}
                        {toDateTimeLabel(row.updatedAt || row.createdAt)}
                      </p>
                      {toText(row.reason) ? (
                        <p className="mt-1 font-body text-sm text-muted-foreground">
                          {toText(row.reason)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}

      {section === "comments" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Registrar comentario"
            description="Compartilhe elogios, ocorrencias e pontos de melhoria."
            icon={FileText}
          >
            <form className="space-y-3" onSubmit={handleSaveComment}>
              <select
                value={selectedStudentId ?? ""}
                onChange={event =>
                  setSelectedStudentId(toNumber(event.target.value) ?? null)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione o aluno</option>
                {enrolledStudentRows.map(studentRow => {
                  const studentId = toNumber(studentRow.id);
                  if (!studentId) return null;
                  return (
                    <option key={studentId} value={studentId}>
                      {toText(studentRow.name) || `Aluno ${studentId}`}
                    </option>
                  );
                })}
              </select>

              <select
                value={commentCategory}
                onChange={event =>
                  setCommentCategory(event.target.value as CommentCategory)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(COMMENT_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>

              <select
                value={commentVisibility}
                onChange={event =>
                  setCommentVisibility(event.target.value as CommentVisibility)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="student">Visivel para aluno</option>
                <option value="guardian">Visivel para responsavel</option>
                <option value="school">Visivel para escola</option>
                <option value="all">Visivel para todos</option>
              </select>

              <textarea
                value={commentContent}
                onChange={event => setCommentContent(event.target.value)}
                rows={4}
                placeholder="Descreva o registro pedagógico"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={createRegistryMutation.isPending}
                className="rounded-lg bg-red-brand px-4 py-2 text-sm font-heading font-semibold text-white disabled:opacity-70"
              >
                {createRegistryMutation.isPending
                  ? "Salvando..."
                  : "Registrar comentario"}
              </button>
            </form>
          </SectionPanel>

          <SectionPanel
            title="Ultimos comentarios"
            description="Historico de observacoes registradas pelo professor."
            icon={MessageSquare}
          >
            {commentRows.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Nenhum comentario"
                description="Os comentarios registrados aparecerao nesta lista."
              />
            ) : (
              <div className="space-y-2">
                {commentRows.map(comment => {
                  const studentId = toNumber(comment.studentId);
                  const studentName = studentId
                    ? (studentById.get(studentId) ?? `Aluno ${studentId}`)
                    : "Aluno";
                  const category =
                    (toText(comment.category) as CommentCategory) ||
                    "comentario";

                  return (
                    <div
                      key={toText(comment.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {studentName}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {COMMENT_CATEGORY_LABELS[category]} •{" "}
                        {toDateTimeLabel(comment.createdAt)}
                      </p>
                      <p className="mt-1 font-body text-sm text-muted-foreground">
                        {toText(comment.content)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}

      {section === "grades" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Lancar desempenho"
            description="Registre notas e feedback de cada avaliacao."
            icon={BookOpenCheck}
          >
            <form className="space-y-3" onSubmit={handleSaveGrade}>
              <select
                value={selectedClassId ?? ""}
                onChange={event =>
                  setSelectedClassId(toNumber(event.target.value) ?? null)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione a turma</option>
                {classRows.map(classRow => {
                  const classId = toNumber(classRow.id);
                  if (!classId) return null;
                  return (
                    <option key={classId} value={classId}>
                      {toText(classRow.name) || `Turma ${classId}`}
                    </option>
                  );
                })}
              </select>

              <select
                value={selectedStudentId ?? ""}
                onChange={event =>
                  setSelectedStudentId(toNumber(event.target.value) ?? null)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione o aluno</option>
                {enrolledStudentRows.map(studentRow => {
                  const studentId = toNumber(studentRow.id);
                  if (!studentId) return null;
                  return (
                    <option key={studentId} value={studentId}>
                      {toText(studentRow.name) || `Aluno ${studentId}`}
                    </option>
                  );
                })}
              </select>

              <input
                type="text"
                value={gradeTitle}
                onChange={event => setGradeTitle(event.target.value)}
                placeholder="Titulo da avaliacao"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <input
                type="date"
                value={gradeDate}
                onChange={event => setGradeDate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <input
                type="text"
                value={gradeValue}
                onChange={event => setGradeValue(event.target.value)}
                placeholder="Nota (0 a 10)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <textarea
                value={gradeFeedback}
                onChange={event => setGradeFeedback(event.target.value)}
                rows={3}
                placeholder="Feedback (opcional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={
                  createRegistryMutation.isPending ||
                  updateRegistryMutation.isPending
                }
                className="rounded-lg bg-red-brand px-4 py-2 text-sm font-heading font-semibold text-white disabled:opacity-70"
              >
                {createRegistryMutation.isPending ||
                updateRegistryMutation.isPending
                  ? "Salvando..."
                  : "Salvar nota"}
              </button>
            </form>
          </SectionPanel>

          <SectionPanel
            title="Avaliacoes recentes"
            description="Historico das avaliacoes criadas por voce."
            icon={BookOpenCheck}
          >
            {assessmentRows.length === 0 ? (
              <EmptyState
                icon={BookOpenCheck}
                title="Sem avaliacoes"
                description="Crie a primeira avaliacao e registre notas por aluno."
              />
            ) : (
              <div className="space-y-2">
                {assessmentRows.map(assessment => {
                  const classSubjectId = toNumber(assessment.classSubjectId);
                  const className = (() => {
                    if (!classSubjectId) return "Turma nao identificada";
                    const classSubject = classSubjectRows.find(
                      row => toNumber(row.id) === classSubjectId
                    );
                    const classId = toNumber(classSubject?.classId);
                    return classId
                      ? (classById.get(classId) ?? `Turma ${classId}`)
                      : "Turma nao identificada";
                  })();

                  return (
                    <div
                      key={toText(assessment.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {toText(assessment.title) || "Avaliacao"}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {className} • {toDateLabel(assessment.assessmentDate)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}
    </div>
  );
}

function StudentWorkspace({ sectionId }: { sectionId: string }) {
  const studentProfileQuery = trpc.profiles.student.me.useQuery(undefined, {
    retry: false,
  });
  const gradesQuery = trpc.profiles.student.grades.useQuery(undefined, {
    retry: false,
  });
  const communicationsQuery = trpc.profiles.student.communications.useQuery(
    undefined,
    {
      retry: false,
    }
  );

  const studentId = studentProfileQuery.data?.id ?? null;

  const commentsQuery = trpc.registry.list.useQuery(
    studentId
      ? {
          entity: "studentComments",
          filters: { studentId },
          limit: 100,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "studentComments",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(studentId) }
  );

  const gradeItems = gradesQuery.data ?? [];
  const communicationItems = communicationsQuery.data ?? [];
  const commentRows = asRows(commentsQuery.data);

  if (studentProfileQuery.isLoading) {
    return (
      <SectionPanel
        title="Carregando painel do aluno"
        description="Buscando seu desempenho e comunicados."
        icon={GraduationCap}
      >
        <p className="font-body text-sm text-muted-foreground">
          Aguarde alguns instantes...
        </p>
      </SectionPanel>
    );
  }

  if (!studentProfileQuery.data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Perfil de aluno nao encontrado"
        description="Conclua o onboarding para visualizar faltas, notas e comentarios."
      />
    );
  }

  const section = sectionId;
  const averageGrade =
    typeof studentProfileQuery.data.averageGrade === "number"
      ? studentProfileQuery.data.averageGrade.toFixed(2)
      : "-";

  return (
    <div className="space-y-6">
      {section === "overview" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Media geral"
              value={averageGrade}
              icon={BookOpenCheck}
              accentClassName="bg-red-brand"
            />
            <StatCard
              title="Faltas"
              value={String(studentProfileQuery.data.absences ?? 0)}
              icon={ClipboardList}
              accentClassName="bg-blue-brand"
            />
            <StatCard
              title="Lancamentos"
              value={String(gradeItems.length)}
              icon={FileText}
              accentClassName="bg-red-brand"
            />
            <StatCard
              title="Comunicados"
              value={String(communicationItems.length)}
              icon={Bell}
              accentClassName="bg-blue-brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionPanel
              title="Ultimas notas"
              description="Resultado recente por disciplina."
              icon={BookOpenCheck}
            >
              {gradeItems.length === 0 ? (
                <EmptyState
                  icon={BookOpenCheck}
                  title="Sem notas registradas"
                  description="As notas lancadas pelos professores serao exibidas aqui."
                />
              ) : (
                <div className="space-y-2">
                  {gradeItems.slice(0, 6).map((grade, index) => (
                    <div
                      key={`${grade.subject}-${index}`}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {grade.subject}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Nota {grade.grade} • {toDateLabel(grade.date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              title="Comentarios recentes"
              description="Feedback de aprendizagem sem identificacao de professor."
              icon={MessageSquare}
            >
              {commentRows.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Sem comentarios"
                  description="Os comentarios pedagogicos aparecerao aqui."
                />
              ) : (
                <div className="space-y-2">
                  {commentRows.slice(0, 6).map(comment => {
                    const category =
                      (toText(comment.category) as CommentCategory) ||
                      "comentario";
                    return (
                      <div
                        key={toText(comment.id)}
                        className="rounded-xl border border-border bg-muted/20 p-3"
                      >
                        <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          {COMMENT_CATEGORY_LABELS[category]}
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {toText(comment.content)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionPanel>
          </div>
        </>
      ) : null}

      {section === "grades" ? (
        <SectionPanel
          title="Historico de notas"
          description="Acompanhe o desempenho por disciplina."
          icon={BookOpenCheck}
        >
          {gradesQuery.isLoading ? (
            <p className="font-body text-sm text-muted-foreground">
              Carregando notas...
            </p>
          ) : gradeItems.length === 0 ? (
            <EmptyState
              icon={BookOpenCheck}
              title="Sem notas disponiveis"
              description="As avaliacoes lancadas serao listadas nesta secao."
            />
          ) : (
            <div className="space-y-2">
              {gradeItems.map((grade, index) => (
                <div
                  key={`${grade.subject}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div>
                    <p className="font-heading font-semibold text-foreground">
                      {grade.subject}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {toDateLabel(grade.date)}
                    </p>
                  </div>
                  <p className="font-display text-2xl font-bold text-red-brand">
                    {grade.grade}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      ) : null}

      {section === "comments" ? (
        <SectionPanel
          title="Comentarios pedagogicos"
          description="Visiveis para voce sem autoria explicita de professor."
          icon={FileText}
        >
          {commentsQuery.isLoading ? (
            <p className="font-body text-sm text-muted-foreground">
              Carregando comentarios...
            </p>
          ) : commentRows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem comentarios"
              description="Quando houver registros, eles aparecerao nesta area."
            />
          ) : (
            <div className="space-y-2">
              {commentRows.map(comment => {
                const category =
                  (toText(comment.category) as CommentCategory) || "comentario";
                return (
                  <div
                    key={toText(comment.id)}
                    className="rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {COMMENT_CATEGORY_LABELS[category]} •{" "}
                      {toDateLabel(comment.createdAt)}
                    </p>
                    <p className="mt-1 font-body text-sm text-foreground">
                      {toText(comment.content)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionPanel>
      ) : null}

      {section === "communications" ? (
        <SectionPanel
          title="Comunicados recebidos"
          description="Mensagens da escola e equipe pedagogica."
          icon={Bell}
        >
          {communicationsQuery.isLoading ? (
            <p className="font-body text-sm text-muted-foreground">
              Carregando comunicados...
            </p>
          ) : communicationItems.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Sem comunicados"
              description="Os comunicados oficiais serao exibidos aqui."
            />
          ) : (
            <div className="space-y-2">
              {communicationItems.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <p className="font-heading font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    {COMMUNICATION_TYPE_LABELS[
                      (item.type as CommunicationType) || "announcement"
                    ] || "Comunicado"}
                    {" • "}
                    {toDateTimeLabel(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      ) : null}
    </div>
  );
}

function GuardianWorkspace({
  sectionId,
  userId,
}: {
  sectionId: string;
  userId: number;
}) {
  const studentsQuery = trpc.profiles.guardian.students.useQuery(undefined, {
    retry: false,
  });

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const performanceQuery = trpc.profiles.guardian.studentPerformance.useQuery(
    { studentId: selectedStudentId ?? 0 },
    { enabled: Boolean(selectedStudentId) }
  );

  const guardianRecordQuery = trpc.registry.list.useQuery({
    entity: "guardians",
    filters: { userId },
    limit: 1,
    offset: 0,
    orderDirection: "desc",
  });

  const guardianRecord = asRows(guardianRecordQuery.data)[0] ?? null;
  const schoolId = toNumber(guardianRecord?.schoolId);

  const eventsQuery = trpc.registry.list.useQuery(
    schoolId
      ? {
          entity: "schoolEvents",
          filters: { schoolId },
          limit: 100,
          offset: 0,
          orderBy: "startsAt",
          orderDirection: "desc",
        }
      : {
          entity: "schoolEvents",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(schoolId) }
  );

  const communicationsQuery = trpc.registry.list.useQuery(
    schoolId
      ? {
          entity: "communications",
          filters: { schoolId },
          limit: 100,
          offset: 0,
          orderBy: "createdAt",
          orderDirection: "desc",
        }
      : {
          entity: "communications",
          limit: 1,
          offset: 0,
          orderDirection: "desc",
        },
    { enabled: Boolean(schoolId) }
  );

  const students = studentsQuery.data ?? [];
  const performanceGrades = performanceQuery.data?.grades ?? [];
  const performanceAlerts = performanceQuery.data?.alerts ?? [];
  const events = asRows(eventsQuery.data);
  const communications = asRows(communicationsQuery.data);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }

    const exists = students.some(student => student.id === selectedStudentId);
    if (!exists) {
      setSelectedStudentId(students[0]?.id ?? null);
    }
  }, [students, selectedStudentId]);

  if (studentsQuery.isLoading || guardianRecordQuery.isLoading) {
    return (
      <SectionPanel
        title="Carregando painel de responsavel"
        description="Buscando dependentes, desempenho e notificacoes."
        icon={Users}
      >
        <p className="font-body text-sm text-muted-foreground">
          Aguarde alguns instantes...
        </p>
      </SectionPanel>
    );
  }

  if (!students.length) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum dependente vinculado"
        description="Solicite a vinculacao de alunos para acompanhar desempenho e comunicacao escolar."
      />
    );
  }

  const section = sectionId;

  return (
    <div className="space-y-6">
      {section === "students" ? (
        <SectionPanel
          title="Dependentes"
          description="Selecione o aluno para abrir desempenho, comentarios e eventos."
          icon={Users}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {students.map(student => {
              const active = selectedStudentId === student.id;
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-red-brand bg-red-brand text-white"
                      : "border-border bg-muted/20 hover:bg-muted/30"
                  }`}
                >
                  <p className="font-heading text-base font-semibold">
                    {student.name}
                  </p>
                  <p
                    className={`font-body text-xs ${
                      active ? "text-white/85" : "text-muted-foreground"
                    }`}
                  >
                    {student.grade || "Serie nao informada"} • Media{" "}
                    {student.averageGrade?.toFixed(2) ?? "-"}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionPanel>
      ) : null}

      {section === "performance" ? (
        <SectionPanel
          title="Desempenho do aluno"
          description="Notas, progresso e faltas do dependente selecionado."
          icon={BookOpenCheck}
        >
          {!selectedStudentId ? (
            <EmptyState
              icon={BookOpenCheck}
              title="Selecione um aluno"
              description="Escolha um dependente para visualizar o desempenho."
            />
          ) : performanceQuery.isLoading ? (
            <p className="font-body text-sm text-muted-foreground">
              Carregando desempenho...
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                  title="Notas"
                  value={String(performanceGrades.length)}
                  icon={BookOpenCheck}
                  accentClassName="bg-red-brand"
                />
                <StatCard
                  title="Faltas"
                  value={String(performanceQuery.data?.absences ?? 0)}
                  icon={ClipboardList}
                  accentClassName="bg-blue-brand"
                />
                <StatCard
                  title="Alertas"
                  value={String(performanceAlerts.length)}
                  icon={AlertCircle}
                  accentClassName="bg-red-brand"
                />
              </div>

              {performanceGrades.length === 0 ? (
                <EmptyState
                  icon={BookOpenCheck}
                  title="Sem notas"
                  description="As notas registradas pela escola e professores aparecerao aqui."
                />
              ) : (
                <div className="space-y-2">
                  {performanceGrades.map((grade, index) => {
                    const numericGrade = Number(grade.grade);
                    const width = Number.isFinite(numericGrade)
                      ? Math.max(0, Math.min(100, (numericGrade / 10) * 100))
                      : 0;

                    return (
                      <div
                        key={`${grade.subject}-${index}`}
                        className="rounded-xl border border-border bg-muted/20 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-heading font-semibold text-foreground">
                            {grade.subject}
                          </p>
                          <p className="font-body text-sm font-semibold text-red-brand">
                            {grade.grade}
                          </p>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-red-brand"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <p className="mt-1 font-body text-xs text-muted-foreground">
                          {toDateLabel(grade.date)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </SectionPanel>
      ) : null}

      {section === "comments" ? (
        <SectionPanel
          title="Comentarios com autoria"
          description="Visao do responsavel com identificacao do professor quando disponivel."
          icon={MessageSquare}
        >
          {!selectedStudentId ? (
            <EmptyState
              icon={MessageSquare}
              title="Selecione um aluno"
              description="Escolha um dependente para visualizar os comentarios."
            />
          ) : performanceQuery.isLoading ? (
            <p className="font-body text-sm text-muted-foreground">
              Carregando comentarios...
            </p>
          ) : performanceAlerts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Sem comentarios"
              description="Quando houver registros de professores, eles aparecerao nesta secao."
            />
          ) : (
            <div className="space-y-2">
              {performanceAlerts.map((alert, index) => (
                <div
                  key={`${alert}-${index}`}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <p className="font-body text-sm text-foreground">{alert}</p>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      ) : null}

      {section === "events" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionPanel
            title="Eventos escolares"
            description="Calendario institucional compartilhado pela gestao."
            icon={CalendarClock}
          >
            {eventsQuery.isLoading ? (
              <p className="font-body text-sm text-muted-foreground">
                Carregando eventos...
              </p>
            ) : events.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Sem eventos publicados"
                description="Eventos e datas relevantes da escola aparecerao aqui."
              />
            ) : (
              <div className="space-y-2">
                {events.map(event => {
                  const eventType =
                    (toText(event.eventType) as SchoolEventType) ||
                    "evento_escolar";
                  return (
                    <div
                      key={toText(event.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {toText(event.title) || "Evento"}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {EVENT_TYPE_LABELS[eventType]} •{" "}
                        {toDateTimeLabel(event.startsAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>

          <SectionPanel
            title="Comunicados oficiais"
            description="Notificacoes enviadas pela escola para os responsaveis."
            icon={Bell}
          >
            {communicationsQuery.isLoading ? (
              <p className="font-body text-sm text-muted-foreground">
                Carregando comunicados...
              </p>
            ) : communications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Sem comunicados"
                description="Comunicados da escola serao listados aqui."
              />
            ) : (
              <div className="space-y-2">
                {communications.map(communication => {
                  const communicationType =
                    (toText(
                      communication.communicationType
                    ) as CommunicationType) || "announcement";
                  return (
                    <div
                      key={toText(communication.id)}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <p className="font-heading font-semibold text-foreground">
                        {toText(communication.title) || "Comunicado"}
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        {toText(communication.body)}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        {COMMUNICATION_TYPE_LABELS[communicationType]} •{" "}
                        {toDateTimeLabel(communication.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </div>
      ) : null}
    </div>
  );
}
