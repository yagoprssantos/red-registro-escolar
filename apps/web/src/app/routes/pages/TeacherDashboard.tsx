/*
 * TeacherDashboard — RED Registro Escolar Digital
 * Dashboard para professores com dados reais
 */

import DemoGuideModal from "@/components/DemoGuideModal";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  BookOpen,
  Loader2,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function TeacherDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [showDemoGuide, setShowDemoGuide] = useState(
    params.get("mode") === "demo"
  );

  // Buscar dados do professor
  const { data: teacherData, isLoading: isLoadingTeacher } =
    trpc.profiles.teacher.me.useQuery(undefined, {
      enabled: isAuthenticated && !loading,
    });

  // Buscar turmas do professor
  const { data: classes = [], isLoading: isLoadingClasses } =
    trpc.profiles.teacher.classes.useQuery(undefined, {
      enabled: isAuthenticated && !loading,
    });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      navigate("/");
    },
    onError: () => {
      toast.error("Erro ao fazer logout");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/profile-selector");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Spinner className="size-4" aria-label="Carregando autenticacao" />
          Carregando dados...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalStudents = classes.reduce((sum, c) => sum + (c.students || 0), 0);

  return (
    <div className="min-h-screen bg-muted/40">
      <DemoGuideModal
        profileTitle="Professor"
        open={showDemoGuide}
        onClose={() => setShowDemoGuide(false)}
      />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">
                R
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground">
                RED
              </h1>
              <p className="font-body text-xs text-muted-foreground">
                Professor
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-4">
            <ThemeToggleButton compact />
            <div className="min-w-0 text-right">
              <p className="truncate font-body text-sm font-medium text-foreground max-w-[10rem] sm:max-w-[14rem]">
                {user?.name}
              </p>
              <p className="truncate font-body text-xs text-muted-foreground max-w-[10rem] sm:max-w-[14rem]">
                {isLoadingTeacher
                  ? "Carregando perfil..."
                  : teacherData?.subject}
              </p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/40 transition-colors font-body text-sm font-medium text-muted-foreground disabled:opacity-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="font-body text-muted-foreground">
            Aqui você pode gerenciar suas turmas, acompanhar alunos e
            comunicar-se com responsáveis
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              label: "Turmas",
              value: classes.length.toString(),
              loading: isLoadingClasses,
              color: "bg-blue-100 text-blue-600",
            },
            {
              icon: BookOpen,
              label: "Alunos",
              value: totalStudents.toString(),
              loading: isLoadingClasses,
              color: "bg-green-100 text-green-600",
            },
            {
              icon: MessageSquare,
              label: "Mensagens",
              value: "12",
              color: "bg-purple-100 text-purple-600",
            },
            {
              icon: BarChart3,
              label: "Avaliações",
              value: "24",
              color: "bg-orange-100 text-orange-600",
            },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card rounded-lg shadow-sm p-6"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
                >
                  <Icon size={24} />
                </div>
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                {stat.loading ? (
                  <Spinner
                    className="size-6 text-muted-foreground"
                    aria-label={`Carregando ${stat.label.toLowerCase()}`}
                  />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Turmas */}
          <div className="lg:col-span-2 bg-card rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Minhas Turmas
            </h3>
            {isLoadingClasses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
                <span className="font-body text-muted-foreground">
                  Carregando turmas...
                </span>
              </div>
            ) : classes.length > 0 ? (
              <div className="space-y-3">
                {classes.map(turma => (
                  <div
                    key={turma.id}
                    className="border border-border rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <p className="font-heading font-medium text-foreground">
                      {turma.name}
                    </p>
                    <p className="font-body text-sm text-muted-foreground">
                      {turma.students} alunos • {turma.subject}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-body text-muted-foreground">
                  Nenhuma turma encontrada
                </p>
              </div>
            )}
          </div>

          {/* Atalhos */}
          <div className="bg-card rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">
              Atalhos
            </h3>
            <div className="space-y-2">
              {[
                { label: "Lançar Notas", icon: BarChart3 },
                { label: "Comunicados", icon: MessageSquare },
                { label: "Frequência", icon: BookOpen },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-muted/40 transition-colors text-left"
                  >
                    <Icon size={18} className="text-blue-600 flex-shrink-0" />
                    <span className="font-body text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
