/*
 * FloatingLoginButton — RED Registro Escolar Digital
 * Botão flutuante fixo na tela para fácil acesso ao login
 */

import { useState, useEffect } from "react";
import { LogIn, X } from "lucide-react";

export default function FloatingLoginButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar botão após scroll de 300px
      setIsVisible(window.scrollY > 300);
      
      // Calcular progresso de scroll
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      {/* Pulse Animation Background */}
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-red-brand/20 rounded-full animate-pulse" />
      
      {/* Main Button */}
      <a
        href="/profile-selector"
        className="relative flex items-center gap-2 px-6 py-3 bg-red-brand text-white font-heading font-semibold rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
      >
        {/* Icon with animation */}
        <div className="flex items-center justify-center w-6 h-6 group-hover:rotate-12 transition-transform">
          <LogIn size={20} />
        </div>
        
        {/* Text */}
        <span className="text-sm">Entrar</span>
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </a>

      {/* Scroll Progress Indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-2 rounded-full shadow-md">
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-full border-2 border-red-brand transition-all duration-300"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% ${100 - scrollProgress}%, 0 ${100 - scrollProgress}%)`,
            }}
          />
          <span className="text-[10px] font-semibold text-gray-700">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs text-sm text-gray-700 border-l-4 border-red-brand">
        <p className="font-heading font-semibold text-gray-900 mb-1">Acesso Rápido</p>
        <p className="text-xs text-gray-600">
          Clique para acessar a plataforma como professor, aluno ou responsável.
        </p>
      </div>
    </div>
  );
}
