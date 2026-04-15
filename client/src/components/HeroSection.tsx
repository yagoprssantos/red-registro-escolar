/*
 * HeroSection — RED Registro Escolar Digital
 * Design: Divisão diagonal vermelho/branco, tipografia Playfair Display expressiva
 * Imagem de escola com overlay, estatísticas animadas
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-hero-bg-GcCe4zBbNkWen9uhqXJpPm.webp";

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const schools = useCountUp(500, 2200, visible);
  const students = useCountUp(120000, 2500, visible);
  const satisfaction = useCountUp(98, 1800, visible);

  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden pt-20">
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
      <div className="container relative z-10 py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Tag */}
          <div
            className={`inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-body text-xs font-medium text-white tracking-widest uppercase">
              Plataforma Educacional Digital
            </span>
          </div>

          {/* Title */}
          <h1
            className={`font-display text-5xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 transition-all duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Registro Escolar{" "}
            <span className="italic text-white/90">Digital</span>{" "}
            <br />
            <span className="text-white/80 text-4xl lg:text-5xl font-normal">
              que transforma a educação
            </span>
          </h1>

          {/* Description */}
          <p
            className={`font-body text-base lg:text-lg text-white/85 leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Centralize registros acadêmicos, comportamentais e comunicações em uma única plataforma. 
            Aproxime escola e família com transparência, agilidade e inteligência pedagógica.
          </p>

          {/* Checkpoints */}
          <ul
            className={`flex flex-col gap-2 mb-10 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {[
              "Comunicação direta entre escola e responsáveis",
              "Acompanhamento em tempo real do desempenho",
              "Relatórios pedagógicos automatizados",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-white/90">
                <CheckCircle2 size={16} className="text-white flex-shrink-0" />
                <span className="font-body text-sm">{item}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 delay-400 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#contato")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 bg-white text-red-brand font-heading font-semibold text-sm px-7 py-3.5 rounded-sm hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Solicitar Demonstração
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#funcionalidades"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#funcionalidades")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 border-2 border-white/60 text-white font-heading font-semibold text-sm px-7 py-3.5 rounded-sm hover:bg-white/10 transition-all duration-200"
            >
              Conhecer Funcionalidades
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className={`mt-16 lg:mt-20 grid grid-cols-3 gap-4 max-w-xl transition-all duration-700 delay-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { value: schools, suffix: "+", label: "Escolas Atendidas" },
            { value: students, suffix: "+", label: "Alunos Registrados" },
            { value: satisfaction, suffix: "%", label: "Satisfação" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-sm p-4 text-center"
            >
              <div className="font-condensed font-bold text-3xl lg:text-4xl text-white">
                {stat.value.toLocaleString("pt-BR")}
                <span className="text-white/80">{stat.suffix}</span>
              </div>
              <div className="font-body text-xs text-white/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagonal bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 lg:h-20">
          <path d="M0 80L1440 0V80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
