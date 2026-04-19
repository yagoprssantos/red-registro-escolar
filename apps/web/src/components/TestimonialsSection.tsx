/*
 * TestimonialsSection — RED Registro Escolar Digital
 * Design: Cards com citação grande, foto circular, fundo off-white
 * Carrossel simples com indicadores
 */

import { Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    quote:
      "O RED transformou completamente a gestão da nossa escola. O que antes levava horas em planilhas agora é feito em minutos. A comunicação com as famílias melhorou muito e os pais estão muito mais engajados.",
    name: "Diretora Ana Paula Ferreira",
    role: "Diretora Pedagógica",
    school: "Escola Municipal João XXIII — São Paulo, SP",
    initials: "AF",
    color: "bg-red-brand",
  },
  {
    quote:
      "Como professora, o RED me deu de volta o tempo que eu perdia com burocracia. Agora consigo me dedicar mais ao planejamento das aulas e ao acompanhamento individual dos alunos. É uma ferramenta essencial.",
    name: "Prof. Carlos Eduardo Santos",
    role: "Professor de Matemática",
    school: "Colégio Estadual Rui Barbosa — Belo Horizonte, MG",
    initials: "CS",
    color: "bg-blue-brand",
  },
  {
    quote:
      "Finalmente consigo acompanhar o desempenho da minha filha de verdade. Recebo notificações quando ela falta, quando uma nota é lançada, e posso conversar diretamente com a professora pelo aplicativo. Excelente!",
    name: "Responsável Mariana Costa",
    role: "Mãe de aluna do 7º ano",
    school: "Escola Particular Horizonte — Curitiba, PR",
    initials: "MC",
    color: "bg-blue-brand-light",
  },
  {
    quote:
      "A implantação foi surpreendentemente rápida e a equipe de suporte foi incrível. Em duas semanas já estávamos operando 100% no RED. Os relatórios automáticos para a Secretaria de Educação nos poupam muito trabalho.",
    name: "Coord. Roberto Almeida",
    role: "Coordenador Administrativo",
    school: "Centro Educacional Novo Horizonte — Recife, PE",
    initials: "RA",
    color: "bg-red-brand",
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[current];

  return (
    <section id="depoimentos" className="py-24 bg-accent-light" ref={ref}>
      <div className="container">
        {/* Header */}
        <div
          className={`max-w-2xl mb-16 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="section-divider" />
          <span className="font-condensed font-bold text-xs text-red-brand tracking-widest uppercase mb-3 block">
            Depoimentos
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            O que dizem quem já{" "}
            <span className="italic text-red-brand">usa o RED</span>
          </h2>
        </div>

        {/* Testimonial card */}
        <div
          className={`transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="bg-card rounded-sm shadow-lg p-8 lg:p-12 max-w-4xl relative overflow-hidden">
            {/* Quote icon */}
            <Quote
              size={80}
              className="absolute top-6 right-8 text-gray-100 rotate-180"
              strokeWidth={1}
            />

            <div className="relative z-10">
              <p className="font-display text-xl lg:text-2xl text-foreground leading-relaxed mb-8 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full ${t.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                >
                  <span className="font-condensed font-bold text-white text-lg">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <div className="font-heading font-bold text-foreground text-base">
                    {t.name}
                  </div>
                  <div className="font-body text-sm text-red-brand font-medium">
                    {t.role}
                  </div>
                  <div className="font-body text-xs text-muted-foreground mt-0.5">
                    {t.school}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === current
                    ? "w-8 h-2 bg-red-brand"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Mini cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {testimonials.map((t, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`text-left p-4 rounded-sm border transition-all duration-300 ${
                index === current
                  ? "border-red-brand bg-card shadow-md"
                  : "border-border bg-card/60 hover:bg-card hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="font-condensed font-bold text-white text-xs">
                    {t.initials}
                  </span>
                </div>
                <div className="font-heading font-semibold text-xs text-foreground leading-tight">
                  {t.name.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>
              <div className="font-body text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {t.role}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

