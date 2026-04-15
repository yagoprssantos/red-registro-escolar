/*
 * StudentDashboard — RED Registro Escolar Digital
 * Dashboard para alunos
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Award, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">RED</h1>
              <p className="font-body text-xs text-gray-500">Aluno</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-body text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="font-body text-xs text-gray-500">6º Ano A</p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-body text-sm font-medium text-gray-700 disabled:opacity-50"
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
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="font-body text-gray-600">
            Acompanhe suas notas, atividades e comunicados da escola
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Award, label: "Média", value: "8.5", color: "bg-green-100 text-green-600" },
            { icon: BookOpen, label: "Atividades", value: "12", color: "bg-blue-100 text-blue-600" },
            { icon: TrendingUp, label: "Progresso", value: "85%", color: "bg-purple-100 text-purple-600" },
            { icon: Calendar, label: "Faltas", value: "2", color: "bg-orange-100 text-orange-600" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon size={24} />
                </div>
                <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="font-display text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notas Recentes */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-green-600" />
              Notas Recentes
            </h3>
            <div className="space-y-3">
              {[
                { materia: "Matemática", nota: "8.5", data: "15 de abril" },
                { materia: "Português", nota: "9.0", data: "14 de abril" },
                { materia: "Ciências", nota: "7.8", data: "12 de abril" },
              ].map(item => (
                <div key={item.materia} className="border border-gray-200 rounded-lg p-4 hover:border-green-600 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-medium text-gray-900">{item.materia}</p>
                      <p className="font-body text-sm text-gray-600">{item.data}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-green-600">{item.nota}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comunicados */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              Comunicados
            </h3>
            <div className="space-y-3">
              {[
                "Reunião de pais em 20/04",
                "Prova de Matemática em 18/04",
                "Feriado prolongado",
              ].map(item => (
                <div key={item} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
