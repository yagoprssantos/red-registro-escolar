/*
 * Login — RED Registro Escolar Digital
 * Página de login com redirecionamento OAuth
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowRight, LogIn } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    window.location.href = getLoginUrl("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-brand via-white to-blue-brand flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card rounded-lg shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-red-brand rounded-lg flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-white">
                R
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl font-bold text-foreground text-center mb-2">
            RED
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-8">
            Registro Escolar Digital
          </p>

          {/* Divider */}
          <div className="w-12 h-0.5 bg-red-brand mx-auto mb-8" />

          {/* Content */}
          <div className="mb-8">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-3">
              Bem-vindo de volta!
            </h2>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Acesse sua conta para gerenciar os dados da sua escola, visualizar
              demonstrações solicitadas e acompanhar o progresso da
              implementação do RED.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              "Dashboard com dados em tempo real",
              "Gerenciamento de contatos e demonstrações",
              "Relatórios e analytics",
              "Suporte prioritário",
            ].map(feature => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-brand" />
                </div>
                <span className="font-body text-sm text-muted-foreground">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-red-brand text-white font-heading font-semibold text-sm py-3.5 rounded-lg hover:bg-red-brand-dark transition-all duration-200 shadow-lg hover:shadow-xl group mb-4"
          >
            <LogIn size={18} />
            Entrar com OAuth
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>

          {/* Info */}
          <p className="font-body text-xs text-muted-foreground text-center">
            Você será redirecionado para autenticação segura via OAuth
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-muted" />
            <span className="font-body text-xs text-muted-foreground">OU</span>
            <div className="flex-1 h-px bg-muted" />
          </div>

          {/* Back to Home */}
          <a
            href="/"
            className="block w-full text-center font-heading font-medium text-sm text-red-brand hover:text-red-brand-dark transition-colors py-2"
          >
            ← Voltar para o início
          </a>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="font-body text-xs text-white/80">
            Primeira vez aqui?{" "}
            <a href="/#contato" className="font-semibold hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
