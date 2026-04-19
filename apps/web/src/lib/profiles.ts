import { BookOpen, Heart, User, Users } from "lucide-react";

export type UserProfile = "school" | "teacher" | "student" | "guardian";

export interface ProfileConfig {
  id: UserProfile;
  title: string;
  description: string;
  accentClassName: string;
  softAccentClassName: string;
  icon: typeof BookOpen;
  dashboardPath: string;
}

const profileConfigs: Record<UserProfile, ProfileConfig> = {
  school: {
    id: "school",
    title: "Escola",
    description:
      "Gerencie matrículas, registros e a rotina institucional da rede.",
    accentClassName: "from-red-brand to-red-700",
    softAccentClassName: "from-red-brand/15 to-red-700/10",
    icon: BookOpen,
    dashboardPath: "/dashboard",
  },
  teacher: {
    id: "teacher",
    title: "Professor",
    description:
      "Acesse turmas, acompanhamentos pedagógicos e comunicação ativa.",
    accentClassName: "from-sky-600 to-blue-700",
    softAccentClassName: "from-sky-500/15 to-blue-700/10",
    icon: Users,
    dashboardPath: "/teacher-dashboard",
  },
  student: {
    id: "student",
    title: "Aluno",
    description: "Veja notas, tarefas e comunicados com foco no seu progresso.",
    accentClassName: "from-emerald-600 to-green-700",
    softAccentClassName: "from-emerald-500/15 to-green-700/10",
    icon: User,
    dashboardPath: "/student-dashboard",
  },
  guardian: {
    id: "guardian",
    title: "Responsável",
    description: "Acompanhe desempenho, presença e mensagens da instituição.",
    accentClassName: "from-violet-600 to-purple-700",
    softAccentClassName: "from-violet-500/15 to-purple-700/10",
    icon: Heart,
    dashboardPath: "/guardian-dashboard",
  },
};

export const profileOrder: UserProfile[] = [
  "school",
  "teacher",
  "student",
  "guardian",
];

export function isUserProfile(
  value: string | null | undefined
): value is UserProfile {
  return (
    value === "school" ||
    value === "teacher" ||
    value === "student" ||
    value === "guardian"
  );
}

export function getProfileConfig(profile?: string | null) {
  return profile && isUserProfile(profile)
    ? profileConfigs[profile]
    : profileConfigs.school;
}

export const buildLoginHref = (profile: UserProfile, source?: string) => {
  const url = new URL("/login", window.location.origin);
  url.searchParams.set("profile", profile);

  if (source) {
    url.searchParams.set("source", source);
  }

  return `${url.pathname}${url.search}`;
};

