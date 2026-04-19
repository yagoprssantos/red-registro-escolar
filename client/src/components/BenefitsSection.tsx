/*
 * BenefitsSection — RED Registro Escolar Digital
 * Design: Fundo azul com cards claros, destaque visual consistente em dark mode
 * Três perfis de usuário: Escola, Professor, Família
 */

import { GraduationCap, Heart, UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const profiles = [
  {
    icon: GraduationCap,
    role: "Para a Escola",
    color: "bg-red-brand",
    benefits: [
      "Centralização de todos os dados acadêmicos",
      "Relatórios automáticos para gestão",
      "Redução de 70% no trabalho burocrático",
      "Conformidade com exigências legais e LGPD",
      "Tomada de decisão baseada em dados reais",
      "Comunicação institucional eficiente",
    ],
  },
  {
    icon: UserCheck,
    role: "Para o Professor",
    color: "bg-blue-brand",
    benefits: [
      "Lançamento rápido de notas e frequências",
      "Planejamento de aulas integrado",
      "Comunicação direta com responsáveis",
      "Histórico completo de cada aluno",
      "Menos papelada, mais tempo pedagógico",
      "Acesso de qualquer dispositivo",
    ],
  },
  {
    icon: Heart,
    role: "Para a Família",
    color: "bg-blue-brand-light",
    benefits: [
      "Acompanhamento em tempo real",
      "Notificações de notas e faltas",
      "Canal direto com professores",
      "Boletim digital sempre disponível",
      "Confirmação de eventos e reuniões",
      "Transparência total sobre o filho",
    ],
  },
];

export default function BenefitsSection() {
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
    <section
      id="beneficios"
      className="py-24 bg-blue-brand dark:bg-blue-brand-dark relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative z-10" ref={ref}>
        <div
          className={`max-w-2xl mb-16 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="w-14 h-0.5 bg-white/35 mb-4" />
          <span className="font-condensed font-bold text-xs text-white/65 tracking-widest uppercase mb-3 block">
            Benefícios
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Valor real para{" "}
            <span className="italic text-white/80">todos os envolvidos</span>
          </h2>
          <p className="font-body text-base text-white/75 leading-relaxed">
            O RED foi desenvolvido pensando em cada ator do ecossistema escolar,
            entregando benefícios concretos para gestores, professores e
            famílias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {profiles.map((profile, index) => {
            const Icon = profile.icon;
            return (
              <div
                key={profile.role}
                className={`bg-card dark:bg-card/95 rounded-sm p-7 shadow-xl transition-all duration-700 ${
                  visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 0.15}s` }}
              >
                <div
                  className={`w-12 h-12 ${profile.color} rounded-sm flex items-center justify-center mb-5 shadow-sm`}
                >
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg mb-4">
                  {profile.role}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {profile.benefits.map(benefit => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-brand dark:bg-blue-brand-dark mt-2 flex-shrink-0" />
                      <span className="font-body text-sm text-muted-foreground leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
