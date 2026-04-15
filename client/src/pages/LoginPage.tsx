/*
 * LoginPage — RED Registro Escolar Digital
 * Página de login com redirecionamento OAuth por perfil
 */

import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowRight, BookOpen, Users, User, Heart } from "lucide-react";
import { useLocation } from "wouter";

const profileIcons: Record<string, React.ReactNode> = {
  school: <BookOpen size={20} />,
  teacher: <Users size={20} />,
  student: <User size={20} />,
  guardian: <Heart size={20} />,
};

const profileLabels: Record<string, string> = {
  school: "Escola",
  teacher: "Professor",
  student: "Aluno",
  guardian: "Responsável",
};

const profileColors: Record<string, string> = {
  school: "bg-red-brand hover:bg-[#6b0d19]",
  teacher: "bg-blue-600 hover:bg-blue-700",
  student: "bg-green-600 hover:bg-green-700",
  guardian: "bg-purple-600 hover:bg-purple-700",
};

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const selectedProfile = sessionStorage.getItem("selectedProfile") || "school";

  const handleLogin = () => {
    window.location.href = getLoginUrl(`/dashboard?profile=${selectedProfile}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-brand via-white to-blue-brand flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-red-brand rounded-lg flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-white">R</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl font-bold text-gray-900 text-center mb-2">
            RED
          </h1>
          <p className="font-body text-sm text-gray-600 text-center mb-8">
            Registro Escolar Digital
          </p>

          {/* Divider */}
          <div className="w-12 h-0.5 bg-red-brand mx-auto mb-8" />

          {/* Profile Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-2">
              Acessando como
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${profileColors[selectedProfile]} text-white flex items-center justify-center`}>
                {profileIcons[selectedProfile]}
              </div>
              <div>
                <p className="font-heading font-semibold text-gray-900">
                  {profileLabels[selectedProfile]}
                </p>
                <button
                  onClick={() => {
                    sessionStorage.removeItem("selectedProfile");
                    navigate("/profile-selector");
                  }}
                  className="font-body text-xs text-red-brand hover:underline"
                >
                  Mudar perfil
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h2 className="font-heading font-semibold text-lg text-gray-900 mb-3">
              Bem-vindo de volta!
            </h2>
            <p className="font-body text-sm text-gray-600 leading-relaxed">
              Acesse sua conta para gerenciar dados, acompanhar informações e manter-se conectado com a comunidade escolar.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              "Acesso seguro com autenticação Manus",
              "Dados sincronizados em tempo real",
              "Interface intuitiva e responsiva",
              "Suporte dedicado",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-brand" />
                </div>
                <span className="font-body text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className={`w-full flex items-center justify-center gap-2 ${profileColors[selectedProfile]} text-white font-heading font-semibold text-sm py-3.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group mb-4`}
          >
            <LogIn size={18} />
            Entrar com Manus
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Info */}
          <p className="font-body text-xs text-gray-500 text-center">
            Você será redirecionado para autenticação segura com Manus OAuth
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="font-body text-xs text-gray-400">OU</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Back to Home */}
          <a
            href="/"
            className="block w-full text-center font-heading font-medium text-sm text-red-brand hover:text-[#6b0d19] transition-colors py-2"
          >
            ← Voltar para o início
          </a>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="font-body text-xs text-white/80">
            Primeira vez aqui?{" "}
            <a href="/#contato" className="font-semibold hover:underline">
              Solicite uma demonstração
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
