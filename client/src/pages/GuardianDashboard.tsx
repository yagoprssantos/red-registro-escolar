/*
 * GuardianDashboard — RED Registro Escolar Digital
 * Dashboard para responsáveis (pais/guardiões)
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User, TrendingUp, AlertCircle, MessageSquare, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GuardianDashboard() {
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
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">RED</h1>
              <p className="font-body text-xs text-gray-500">Responsável</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-body text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="font-body text-xs text-gray-500">Pai/Mãe</p>
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
            Acompanhe o desempenho e a comunicação com a escola
          </p>
        </div>

        {/* Filhos */}
        <div className="mb-8">
          <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} className="text-purple-600" />
            Meus Filhos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { nome: "João Silva", serie: "6º Ano A", media: "8.5" },
              { nome: "Maria Silva", serie: "8º Ano B", media: "9.0" },
            ].map(filho => (
              <div key={filho.nome} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
                <p className="font-heading font-semibold text-gray-900 mb-2">{filho.nome}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-gray-600">{filho.serie}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs text-gray-500 uppercase tracking-wider">Média</p>
                    <p className="font-display text-2xl font-bold text-purple-600">{filho.media}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Desempenho */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600" />
              Desempenho - João Silva
            </h3>
            <div className="space-y-4">
              {[
                { materia: "Matemática", nota: "8.5", progresso: 85 },
                { materia: "Português", nota: "9.0", progresso: 90 },
                { materia: "Ciências", nota: "7.8", progresso: 78 },
                { materia: "História", nota: "8.2", progresso: 82 },
              ].map(item => (
                <div key={item.materia}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body font-medium text-gray-900">{item.materia}</p>
                    <p className="font-body text-sm font-semibold text-purple-600">{item.nota}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progresso}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas e Comunicados */}
          <div className="space-y-6">
            {/* Alertas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-600" />
                Alertas
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="font-body text-sm text-orange-900">
                    <strong>Faltas:</strong> 2 faltas não justificadas
                  </p>
                </div>
              </div>
            </div>

            {/* Próximos Eventos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Próximos Eventos
              </h3>
              <div className="space-y-2">
                {[
                  "Reunião de pais - 20/04",
                  "Prova de Matemática - 18/04",
                  "Festa da escola - 25/04",
                ].map(evento => (
                  <p key={evento} className="font-body text-sm text-gray-600">
                    • {evento}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comunicação */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
