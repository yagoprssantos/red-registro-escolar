/*
 * DataSection — RED Registro Escolar Digital
 * Design: Layout editorial com imagem do dashboard à direita, texto à esquerda
 * Fundo off-white com destaque visual da imagem
 */

import { useEffect, useRef, useState } from "react";
import { TrendingUp, PieChart, Activity, Layers } from "lucide-react";

const DASHBOARD_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-dashboard-preview-4yMPsYzoxBo8NTjeaZHgvA.webp";
const DATA_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-academic-data-UVsZbwGibQ3uM7jorqFyEW.webp";

const dataPoints = [
  {
    icon: TrendingUp,
    title: "Desempenho Acadêmico",
    description: "Evolução de notas por aluno, turma e disciplina ao longo do tempo.",
  },
  {
    icon: Activity,
    title: "Frequência e Presença",
    description: "Monitoramento de faltas com alertas automáticos para responsáveis.",
  },
  {
    icon: PieChart,
    title: "Indicadores de Turma",
    description: "Comparativos entre turmas e identificação de alunos em risco.",
  },
  {
    icon: Layers,
    title: "Histórico Completo",
    description: "Linha do tempo acadêmica e comportamental de cada estudante.",
  },
];

export default function DataSection() {
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
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-card" ref={ref}>
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="section-divider" />
            <span className="font-condensed font-bold text-xs text-red-brand tracking-widest uppercase mb-3 block">
              Inteligência de Dados
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
              Decisões pedagógicas{" "}
              <span className="italic text-red-brand">baseadas em dados</span>
            </h2>
            <p className="font-body text-base text-muted-foreground leading-relaxed mb-8">
              O RED transforma dados brutos em insights acionáveis. Dashboards intuitivos permitem 
              que gestores e professores identifiquem padrões, antecipem problemas e tomem decisões 
              pedagógicas com mais confiança e precisão.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {dataPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className={`transition-all duration-500 ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-sm bg-red-brand/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={18} className="text-red-brand" />
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-foreground text-sm mb-1">
                          {point.title}
                        </h4>
                        <p className="font-body text-xs text-muted-foreground leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Images */}
          <div
            className={`transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative">
              {/* Main image */}
              <div className="relative z-10">
                <img
                  src={DASHBOARD_IMAGE}
                  alt="Dashboard do RED com gráficos e relatórios"
                  className="w-full rounded-sm shadow-2xl"
                />
              </div>
              {/* Floating secondary image */}
              <div className="absolute -bottom-8 -left-8 w-48 z-20 shadow-xl rounded-sm overflow-hidden border-4 border-white">
                <img
                  src={DATA_IMAGE}
                  alt="Visualização de dados acadêmicos"
                  className="w-full"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-brand/10 rounded-sm -z-10" />
              <div className="absolute -bottom-4 right-8 w-16 h-16 bg-blue-brand/10 rounded-sm -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
