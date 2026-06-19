import type { UserProfile } from "@/lib/profiles";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  LayoutGrid,
  Link2,
  Megaphone,
  MessageSquare,
  Monitor,
  School,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

export type DashboardSection = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const PROFILE_ACCENT: Record<UserProfile, string> = {
  school: "from-red-brand to-red-700",
  teacher: "from-blue-brand to-blue-700",
  student: "from-emerald-600 to-emerald-800",
  guardian: "from-violet-600 to-violet-800",
};

export const PROFILE_INITIALS_BG: Record<UserProfile, string> = {
  school: "bg-red-brand/15 text-red-brand",
  teacher: "bg-blue-brand/15 text-blue-brand",
  student: "bg-emerald-500/15 text-emerald-600",
  guardian: "bg-violet-500/15 text-violet-600",
};

export const PROFILE_BY_ROLE: Record<string, UserProfile> = {
  admin: "school",
  school_staff: "school",
  teacher: "teacher",
  student: "student",
  guardian: "guardian",
};

export const PROFILE_SECTIONS: Record<UserProfile, DashboardSection[]> = {
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
      id: "profile",
      title: "Meu Perfil",
      description: "Dados pessoais e ficha biográfica.",
      icon: User,
    },
    {
      id: "schedule",
      title: "Horário",
      description: "Grade de aulas semanal.",
      icon: Clock,
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
      id: "notices",
      title: "Avisos",
      description: "Comunicados e eventos.",
      icon: Bell,
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
  ],
};

export function resolveProfileFromRole(
  role: string | null | undefined
): UserProfile | null {
  if (!role) return null;
  return PROFILE_BY_ROLE[role] ?? null;
}

export function getFirstSectionId(profile: UserProfile): string {
  return PROFILE_SECTIONS[profile]?.[0]?.id ?? "overview";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}
