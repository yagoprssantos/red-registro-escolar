/*
 * StudentDashboard — RED Registro Escolar Digital
 * Dashboard para alunos com dados reais
 */

import DemoGuideModal from "@/components/DemoGuideModal";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Award,
  BookOpen,
  Calendar,
  Loader2,
  LogOut,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function StudentDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [showDemoGuide, setShowDemoGuide] = useState(
    params.get("mode") === "demo"
  );

  // Buscar dados do aluno
  const { data: studentData, isLoading: isLoadingStudent } =
    trpc.profiles.student.me.useQuery(undefined, {
      enabled: isAuthenticated && !loading,
    });

  // Buscar notas do aluno
  const { data: grades = [], isLoading: isLoadingGrades } =
    trpc.profiles.student.grades.useQuery(undefined, {
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

  return (
    <div className="min-h-screen bg-muted/40">
      <DemoGuideModal
        profileTitle="Aluno"
        open={showDemoGuide}
        onClose={() => setShowDemoGuide(false)}
      />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">
                R
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground">
                RED
              </h1>
              <p className="font-body text-xs text-muted-foreground">Aluno</p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-4">
            <ThemeToggleButton compact />
            <div className="min-w-0 text-right">
              <p className="truncate font-body text-sm font-medium text-foreground max-w-[10rem] sm:max-w-[14rem]">
                {user?.name}
              </p>
              <p className="truncate font-body text-xs text-muted-foreground max-w-[10rem] sm:max-w-[14rem]">
                {isLoadingStudent ? "Carregando perfil..." : studentData?.grade}
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
            Acompanhe suas notas, atividades e comunicados da escola
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Award,
              label: "Média",
              value: studentData?.averageGrade?.toFixed(1) || "-",
              loading: isLoadingStudent,
              color: "bg-green-100 text-green-600",
            },
            {
              icon: BookOpen,
              label: "Atividades",
              value: grades.length.toString(),
              loading: isLoadingGrades,
              color: "bg-blue-100 text-blue-600",
            },
            {
              icon: TrendingUp,
              label: "Progresso",
              value: "85%",
              color: "bg-purple-100 text-purple-600",
            },
            {
              icon: Calendar,
              label: "Faltas",
              value: (studentData?.absences || 0).toString(),
              loading: isLoadingStudent,
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
          {/* Notas Recentes */}
          <div className="lg:col-span-2 bg-card rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award size={20} className="text-green-600" />
              Notas Recentes
            </h3>
            {isLoadingGrades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-2" />
                <span className="font-body text-muted-foreground">
                  Carregando notas...
                </span>
              </div>
            ) : grades.length > 0 ? (
              <div className="space-y-3">
                {grades.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-4 hover:border-green-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-heading font-medium text-foreground">
                          {item.subject}
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          {new Date(item.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold text-green-600">
                          {item.grade}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-body text-muted-foreground">
                  Nenhuma nota registrada ainda
                </p>
              </div>
            )}
          </div>

          {/* Comunicados */}
          <div className="bg-card rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              Comunicados
            </h3>
            <div className="space-y-3">
              {[
                "Reunião de pais em 20/04",
                "Prova de Matemática em 18/04",
                "Feriado prolongado",
              ].map(item => (
                <div
                  key={item}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <p className="font-body text-sm text-blue-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
