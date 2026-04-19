/*
 * GuardianDashboard — RED Registro Escolar Digital
 * Dashboard para responsáveis com dados reais
 */

import { useAuth } from "@/_core/hooks/useAuth";
import DemoGuideModal from "@/components/DemoGuideModal";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  Calendar,
  Loader2,
  LogOut,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function GuardianDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const params = new URLSearchParams(window.location.search);
  const [showDemoGuide, setShowDemoGuide] = useState(
    params.get("mode") === "demo"
  );

  // Buscar dados do responsável
  const { data: guardianData, isLoading: isLoadingGuardian } =
    trpc.profiles.guardian.me.useQuery(undefined, {
      enabled: isAuthenticated && !loading,
    });

  // Buscar filhos/alunos do responsável
  const { data: students = [], isLoading: isLoadingStudents } =
    trpc.profiles.guardian.students.useQuery(undefined, {
      enabled: isAuthenticated && !loading,
    });

  // Buscar desempenho do aluno selecionado
  const { data: performance, isLoading: isLoadingPerformance } =
    trpc.profiles.guardian.studentPerformance.useQuery(
      { studentId: selectedStudentId || 1 },
      { enabled: isAuthenticated && !loading && selectedStudentId !== null }
    );

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

  useEffect(() => {
    if (students && students.length > 0 && selectedStudentId === null) {
      const firstStudent = students[0] as any;
      setSelectedStudentId(firstStudent?.id || 1);
    }
  }, [students, selectedStudentId]);

  if (loading || isLoadingGuardian) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-foreground">Carregando dados...</p>
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
        profileTitle="Responsavel"
        open={showDemoGuide}
        onClose={() => setShowDemoGuide(false)}
      />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">
                R
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                RED
              </h1>
              <p className="font-body text-xs text-muted-foreground">
                Responsável
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggleButton compact />
            <div className="text-right">
              <p className="font-body text-sm font-medium text-foreground">
                {user?.name}
              </p>
              <p className="font-body text-xs text-muted-foreground">Pai/Mãe</p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/40 transition-colors font-body text-sm font-medium text-muted-foreground disabled:opacity-50"
            >
              <LogOut size={16} />
              Sair
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
            Acompanhe o desempenho e a comunicação com a escola
          </p>
        </div>

        {/* Filhos */}
        <div className="mb-8">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <User size={20} className="text-purple-600" />
            Meus Filhos
          </h3>
          {isLoadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin mr-2" />
              <span className="font-body text-muted-foreground">
                Carregando filhos...
              </span>
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(students || []).map((filho: any) => (
                <button
                  key={filho.id}
                  onClick={() => setSelectedStudentId(filho.id)}
                  className={`bg-card rounded-lg shadow-sm p-6 border-l-4 transition-all ${
                    selectedStudentId === filho.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-border hover:border-purple-600"
                  }`}
                >
                  <p className="font-heading font-semibold text-foreground mb-2 text-left">
                    {filho.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-body text-sm text-muted-foreground">
                        {filho.grade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">
                        Média
                      </p>
                      <p className="font-display text-2xl font-bold text-purple-600">
                        {filho.averageGrade?.toFixed(1) || "-"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-card rounded-lg">
              <p className="font-body text-muted-foreground">
                Nenhum filho cadastrado
              </p>
            </div>
          )}
        </div>

        {/* Main Sections */}
        {selectedStudentId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Desempenho */}
            <div className="lg:col-span-2 bg-card rounded-lg shadow-sm p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                Desempenho Acadêmico
              </h3>
              {isLoadingPerformance ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin mr-2" />
                  <span className="font-body text-muted-foreground">
                    Carregando desempenho...
                  </span>
                </div>
              ) : performance?.grades && performance.grades.length > 0 ? (
                <div className="space-y-4">
                  {performance.grades.map((item: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-body font-medium text-foreground">
                          {item.subject}
                        </p>
                        <p className="font-body text-sm font-semibold text-purple-600">
                          {item.grade}
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(item.grade / 10) * 100}%` }}
                        />
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

            {/* Alertas e Eventos */}
            <div className="space-y-6">
              {/* Alertas */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-orange-600" />
                  Alertas
                </h3>
                {performance?.alerts && performance.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {performance.alerts.map((alert: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <p className="font-body text-sm text-orange-900">
                          {alert}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">
                    Nenhum alerta no momento
                  </p>
                )}
              </div>

              {/* Próximos Eventos */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" />
                  Próximos Eventos
                </h3>
                <div className="space-y-2">
                  {[
                    "Reunião de pais - 20/04",
                    "Prova de Matemática - 18/04",
                    "Festa da escola - 25/04",
                  ].map(evento => (
                    <p
                      key={evento}
                      className="font-body text-sm text-muted-foreground"
                    >
                      • {evento}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comunicação */}
        <div className="mt-8 bg-card rounded-lg shadow-sm p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            Comunicação com a Escola
          </h3>
          <button className="px-6 py-2 bg-purple-600 text-white font-body font-medium text-sm rounded-lg hover:bg-purple-700 transition-colors">
            Enviar Mensagem
          </button>
        </div>
      </main>
    </div>
  );
}
