/*
 * FeaturesSection — RED Registro Escolar Digital
 * Design: Cards com borda esquerda vermelha, ícones em azul, grid assimétrico
 * Scroll reveal com stagger animation
 */

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  Shield,
  Bell,
  FileText,
  Award,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Gestão Acadêmica Completa",
    description:
      "Registre notas, frequências, conteúdos ministrados e avaliações de forma centralizada. Histórico completo por aluno, turma e período letivo.",
    highlight: true,
  },
  {
    icon: Users,
    title: "Perfis de Alunos e Turmas",
    description:
      "Cadastro detalhado de alunos com dados acadêmicos, comportamentais e de saúde. Organização por turmas, séries e turnos.",
    highlight: false,
  },
  {
    icon: MessageSquare,
    title: "Comunicação Escola-Família",
    description:
      "Canal direto entre professores, coordenadores e responsáveis. Envio de avisos, notificações e relatórios em tempo real.",
    highlight: false,
  },
  {
    icon: BarChart3,
    title: "Relatórios e Análises",
    description:
      "Dashboards intuitivos com indicadores de desempenho, frequência e comportamento. Apoio à tomada de decisão pedagógica baseada em dados.",
    highlight: true,
  },
  {
    icon: Calendar,
    title: "Agenda e Calendário Escolar",
    description:
      "Planejamento de aulas, eventos, reuniões e datas importantes. Sincronização com os responsáveis via notificações automáticas.",
    highlight: false,
  },
  {
    icon: Bell,
    title: "Notificações em Tempo Real",
    description:
      "Alertas automáticos sobre faltas, notas lançadas, comunicados e ocorrências. Responsáveis sempre informados e engajados.",
    highlight: false,
  },
  {
    icon: FileText,
    title: "Documentos e Declarações",
    description:
      "Emissão digital de declarações de matrícula, histórico escolar e boletins. Redução de burocracia e agilidade no atendimento.",
    highlight: false,
  },
  {
    icon: Shield,
    title: "Segurança e Privacidade",
    description:
      "Dados protegidos com criptografia e conformidade com a LGPD. Controle de acesso por perfil: diretor, professor, responsável e aluno.",
    highlight: false,
  },
  {
    icon: Award,
    title: "Registro Comportamental",
    description:
      "Acompanhamento do desenvolvimento socioemocional dos alunos. Ocorrências, elogios e observações pedagógicas documentadas.",
    highlight: false,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 80);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index]);

  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`group bg-white border border-gray-100 rounded-sm p-6 hover:shadow-lg transition-all duration-400 ${
        feature.highlight ? "border-l-4 border-l-[#8b1120]" : "hover:border-l-4 hover:border-l-[#8b1120]"
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s, box-shadow 0.3s ease, border 0.3s ease` }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-11 h-11 rounded-sm bg-[#1f3a5f]/8 flex items-center justify-center group-hover:bg-[#8b1120]/10 transition-colors duration-300">
          <Icon size={22} className="text-blue-brand group-hover:text-red-brand transition-colors duration-300" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-gray-900 text-base mb-2 group-hover:text-red-brand transition-colors duration-200">
            {feature.title}
          </h3>
          <p className="font-body text-sm text-gray-600 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
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
    <section id="funcionalidades" className="py-24 bg-[#f9f6f2]">
      <div className="container">
        {/* Header */}
        <div
          ref={titleRef}
          className={`max-w-2xl mb-16 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="section-divider" />
          <span className="font-condensed font-bold text-xs text-red-brand tracking-widest uppercase mb-3 block">
            Funcionalidades
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Tudo que sua escola precisa{" "}
            <span className="italic text-red-brand">em um só lugar</span>
          </h2>
          <p className="font-body text-base text-gray-600 leading-relaxed">
            O RED integra todas as dimensões da vida escolar — do registro acadêmico à comunicação com as famílias — 
            em uma plataforma intuitiva, segura e acessível de qualquer dispositivo.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
