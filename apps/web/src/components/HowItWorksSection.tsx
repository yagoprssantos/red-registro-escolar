/*
 * HowItWorksSection — RED Registro Escolar Digital
 * Design: Layout alternado imagem/texto, numeração em vermelho grande, linha conectora
 */

import { useEffect, useRef, useState } from "react";

const DASHBOARD_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-dashboard-preview-4yMPsYzoxBo8NTjeaZHgvA.webp";
const FAMILY_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-family-communication-SdsbspZyQ9H9YRdBMawYq9.webp";
const STUDENTS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663558029309/MctBPaw7y9F2bAkQ8CzRS9/red-students-learning-Q8BXmbZ3uuKhjYeGkDHznA.webp";

const steps = [
  {
    number: "01",
    title: "Implantação e Configuração",
    subtitle: "Rápida e sem complicações",
    description:
      "Nossa equipe realiza a implantação completa da plataforma na sua escola. Importamos os dados existentes, configuramos turmas, professores e responsáveis, e oferecemos treinamento personalizado para toda a equipe pedagógica.",
    image: DASHBOARD_IMAGE,
    imageAlt: "Dashboard do sistema RED em um laptop",
    points: [
      "Migração de dados existentes",
      "Configuração de perfis e permissões",
      "Treinamento presencial ou remoto",
      "Suporte técnico dedicado",
    ],
    imageRight: false,
  },
  {
    number: "02",
    title: "Registro e Acompanhamento",
    subtitle: "Dados sempre atualizados",
    description:
      "Professores registram frequências, notas e ocorrências diretamente na plataforma, de qualquer dispositivo. Os dados ficam disponíveis em tempo real para coordenadores e diretores, facilitando o acompanhamento pedagógico.",
    image: STUDENTS_IMAGE,
    imageAlt: "Alunos usando dispositivos digitais na escola",
    points: [
      "Lançamento de notas e frequências",
      "Registro de ocorrências e elogios",
      "Planejamento de aulas integrado",
      "Acesso via celular, tablet ou computador",
    ],
    imageRight: true,
  },
  {
    number: "03",
    title: "Comunicação e Engajamento",
    subtitle: "Família sempre conectada",
    description:
      "Responsáveis recebem notificações em tempo real sobre o desempenho e a vida escolar dos seus filhos. A comunicação direta com professores e a escola nunca foi tão fácil e transparente.",
    image: FAMILY_IMAGE,
    imageAlt: "Responsável visualizando relatório escolar no tablet",
    points: [
      "Notificações automáticas para responsáveis",
      "Chat direto com professores",
      "Acesso ao boletim e histórico",
      "Confirmação de presença em eventos",
    ],
    imageRight: false,
  },
];

function StepItem({ step, index }: { step: (typeof steps)[0]; index: number }) {
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

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Text side */}
      <div className={step.imageRight ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
        <div className="flex items-start gap-5">
          <span className="font-condensed font-bold text-7xl lg:text-8xl text-red-brand/15 leading-none select-none flex-shrink-0">
            {step.number}
          </span>
          <div className="pt-2">
            <span className="font-body text-xs font-medium text-red-brand tracking-widest uppercase block mb-2">
              {step.subtitle}
            </span>
            <h3 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
              {step.title}
            </h3>
            <p className="font-body text-base text-muted-foreground leading-relaxed mb-6">
              {step.description}
            </p>
            <ul className="flex flex-col gap-2.5">
              {step.points.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-brand/10 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-brand" />
                  </span>
                  <span className="font-body text-sm text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Image side */}
      <div className={step.imageRight ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
        <div className="relative">
          <div className="absolute -inset-3 bg-red-brand/5 rounded-sm -z-10" />
          <img
            src={step.image}
            alt={step.imageAlt}
            className="w-full h-72 lg:h-80 object-cover rounded-sm shadow-xl"
          />
          {/* Step number badge */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-red-brand rounded-full flex items-center justify-center shadow-lg">
            <span className="font-condensed font-bold text-white text-sm">{step.number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const [titleVisible, setTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTitleVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="como-funciona" className="py-24 bg-card">
      <div className="container">
        {/* Header */}
        <div
          ref={titleRef}
          className={`max-w-2xl mb-20 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="section-divider" />
          <span className="font-condensed font-bold text-xs text-red-brand tracking-widest uppercase mb-3 block">
            Como Funciona
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            Do registro à{" "}
            <span className="italic text-red-brand">decisão pedagógica</span>
          </h2>
          <p className="font-body text-base text-muted-foreground leading-relaxed">
            Em três etapas simples, sua escola passa a operar com mais eficiência, 
            transparência e conexão com as famílias.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-24">
          {steps.map((step, index) => (
            <StepItem key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

