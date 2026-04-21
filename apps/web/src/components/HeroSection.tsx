/*
 * HeroSection — RED Registro Escolar Digital
 * Design: Divisão diagonal vermelho/branco, tipografia Playfair Display expressiva
 * Imagem de escola com overlay
 */

import { CheckCircle2, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

const accessSource = "hero";
const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-hero-bg-GcCe4zBbNkWen9uhqXJpPm.webp";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="inicio"
      className="relative min-h-[92svh] sm:min-h-screen flex items-center overflow-hidden pt-16 sm:pt-20"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Escola moderna com alunos e professores"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#8b1120]/90 via-[#8b1120]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-14 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Title */}
          <h1
            className={`font-display text-[clamp(2rem,8vw,3.8rem)] lg:text-7xl font-bold text-white leading-[1.05] mb-5 sm:mb-6 transition-all duration-700 delay-100 motion-reduce:transition-none ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Registro Escolar{" "}
            <span className="italic text-white/90">Digital</span> <br />
            <span className="inline-block mt-2 sm:mt-3 text-white/80 text-lg sm:text-2xl lg:text-5xl font-normal leading-snug sm:leading-tight max-w-[22ch] sm:max-w-none">
              que facilita o acompanhamento escolar
            </span>
          </h1>

          {/* Description */}
          <p
            className={`font-body text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed mb-6 sm:mb-8 max-w-xl transition-all duration-700 delay-200 motion-reduce:transition-none ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Integre todas as informações da vida escolar em uma única
            plataforma, melhorando a conexão entre escola e família com mais
            praticidade e eficiência no acompanhamento dos alunos.
          </p>

          {/* Checkpoints */}
          <ul
            className={`flex flex-col gap-2 mb-8 sm:mb-10 transition-all duration-700 delay-300 motion-reduce:transition-none ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {[
              "Comunicação direta entre escola e responsáveis",
              "Acompanhamento em tempo real do desempenho",
              "Relatórios pedagógicos automatizados",
            ].map(item => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-white/90"
              >
                <CheckCircle2 size={16} className="text-white flex-shrink-0" />
                <span className="font-body text-sm sm:text-[15px]">{item}</span>
              </li>
            ))}
          </ul>

          {/* Primary CTA */}
          <div
            className={`transition-all duration-700 delay-400 motion-reduce:transition-none ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href={`/profile-selector?source=${accessSource}`}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-card text-red-brand font-heading font-semibold text-sm px-6 sm:px-8 py-3.5 rounded-lg hover:bg-muted/40 transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105 group"
            >
              <LogIn
                size={18}
                className="group-hover:rotate-12 transition-transform"
              />
              <span>Acessar Plataforma</span>
            </a>
          </div>
        </div>
      </div>

      {/* Diagonal bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-16 lg:h-20 text-background"
        >
          <path d="M0 80L1440 0V80H0Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
