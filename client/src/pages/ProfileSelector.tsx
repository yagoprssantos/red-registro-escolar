/*
 * ProfileSelector — RED Registro Escolar Digital
 * Página para seleção de perfil antes do login
 */

import { Button } from "@/components/ui/button";
import { Users, BookOpen, User, Heart } from "lucide-react";
import { useLocation } from "wouter";

type UserProfile = "school" | "teacher" | "student" | "guardian";

interface ProfileOption {
  id: UserProfile;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const profiles: ProfileOption[] = [
  {
    id: "school",
    title: "Escola",
    description: "Gerenciar dados escolares, contatos e demonstrações",
    icon: <BookOpen size={32} />,
    color: "from-red-brand to-red-700",
  },
  {
    id: "teacher",
    title: "Professor",
    description: "Acompanhar turmas, notas e comunicação com responsáveis",
    icon: <Users size={32} />,
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "student",
    title: "Aluno",
    description: "Visualizar notas, atividades e comunicados da escola",
    icon: <User size={32} />,
    color: "from-green-600 to-green-700",
  },
  {
    id: "guardian",
    title: "Responsável",
    description: "Acompanhar desempenho e comunicação com a escola",
    icon: <Heart size={32} />,
    color: "from-purple-600 to-purple-700",
  },
];

export default function ProfileSelector() {
  const [, navigate] = useLocation();

  const handleSelectProfile = (profile: UserProfile) => {
    // Armazenar o perfil selecionado e redirecionar para login
    sessionStorage.setItem("selectedProfile", profile);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-brand rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">RED</h1>
              <p className="font-body text-xs text-gray-500">Registro Escolar Digital</p>
            </div>
          </div>
          <a
            href="/"
            className="font-body text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Voltar
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Escolha seu perfil
            </h2>
            <p className="font-body text-lg text-gray-600">
              Selecione o tipo de acesso que melhor se adequa ao seu papel na plataforma
            </p>
          </div>

          {/* Profile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left"
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${profile.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${profile.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {profile.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                    {profile.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-gray-600 mb-6">
                    {profile.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-red-brand font-medium group-hover:gap-3 transition-all duration-300">
                    <span>Continuar como {profile.title}</span>
                    <span>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="font-body text-sm text-blue-900">
              <strong>Primeira vez aqui?</strong> Se você ainda não tem uma conta, será criada automaticamente após o login. 
              Escolha o perfil que corresponde ao seu papel na instituição de ensino.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
