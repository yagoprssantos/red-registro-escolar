/*
 * TeacherDashboard — RED Registro Escolar Digital
 * Dashboard para professores
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Users, BookOpen, BarChart3, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TeacherDashboard() {
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">RED</h1>
              <p className="font-body text-xs text-gray-500">Professor</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-body text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="font-body text-xs text-gray-500">Professor</p>
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
            Aqui você pode gerenciar suas turmas, acompanhar alunos e comunicar-se com responsáveis
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Turmas", value: "3", color: "bg-blue-100 text-blue-600" },
            { icon: BookOpen, label: "Alunos", value: "87", color: "bg-green-100 text-green-600" },
            { icon: MessageSquare, label: "Mensagens", value: "12", color: "bg-purple-100 text-purple-600" },
            { icon: BarChart3, label: "Avaliações", value: "24", color: "bg-orange-100 text-orange-600" },
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
          {/* Turmas */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Minhas Turmas
            </h3>
            <div className="space-y-3">
              {["6º Ano A", "6º Ano B", "7º Ano A"].map(turma => (
                <div key={turma} className="border border-gray-200 rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer">
                  <p className="font-heading font-medium text-gray-900">{turma}</p>
                  <p className="font-body text-sm text-gray-600">28 alunos • Matemática</p>
                </div>
              ))}
            </div>
          </div>

          {/* Atalhos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-gray-900 mb-4">Atalhos</h3>
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
                    className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Icon size={18} className="text-blue-600 flex-shrink-0" />
                    <span className="font-body text-sm font-medium text-gray-900">{item.label}</span>
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
