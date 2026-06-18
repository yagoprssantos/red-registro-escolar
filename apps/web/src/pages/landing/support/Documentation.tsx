import InfoPageLayout from "@/components/InfoPageLayout";
import { BugOff, Lightbulb, MessageSquare, Send } from "lucide-react";
import { useState } from "react";

const documentationSections = [
  {
    title: "Primeiros passos",
    items: [
      "Validar credenciais e permissões do perfil.",
      "Selecionar instituição e contexto de atuação.",
      "Revisar painel inicial, alertas e pendências.",
    ],
  },
  {
    title: "Fluxos principais",
    items: [
      "Onboarding de escola e configuração inicial.",
      "Registro de interações, contatos e acompanhamentos.",
      "Consulta de dashboards conforme o perfil do usuário.",
    ],
  },
  {
    title: "Boas práticas",
    items: [
      "Padronizar o preenchimento dos registros acadêmicos.",
      "Evitar compartilhamento de contas e credenciais.",
      "Utilizar recursos conforme políticas institucionais.",
    ],
  },
];

function FeedbackSection() {
  const [formData, setFormData] = useState({
    type: "feedback",
    title: "",
    description: "",
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { value: "bug", label: "Reportar Bug", icon: BugOff },
    { value: "feedback", label: "Feedback", icon: MessageSquare },
    { value: "improvement", label: "Sugestão de Melhoria", icon: Lightbulb },
    { value: "other", label: "Outro", icon: Send },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Feedback submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        type: "feedback",
        title: "",
        description: "",
        email: "",
      });
      setSubmitted(false);
    }, 3000);
    // TODO: Integrar com tRPC para enviar dados
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Envie seu Feedback
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Encontrou um problema? Tem uma ideia de melhoria? Sua opinião é muito
          importante para continuarmos melhorando o RED.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {feedbackTypes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFormData(prev => ({ ...prev, type: value }))}
            className={`p-3 rounded-lg border transition text-left flex items-start gap-3 ${
              formData.type === value
                ? "border-red-brand bg-red-brand/10 text-foreground"
                : "border-border bg-muted/50 text-muted-foreground hover:border-red-brand/50"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-semibold text-sm">{label}</span>
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-card border border-border rounded-lg p-6"
      >
        <div>
          <label className="block font-semibold text-sm mb-2 text-foreground">
            Título *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e =>
              setFormData(prev => ({ ...prev, title: e.target.value }))
            }
            placeholder="Resuma seu feedback em uma frase"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand"
          />
        </div>

        <div>
          <label className="block font-semibold text-sm mb-2 text-foreground">
            Descrição *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descreva em detalhes seu feedback ou problema encontrado..."
            rows={5}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand resize-vertical"
          />
        </div>

        <div>
          <label className="block font-semibold text-sm mb-2 text-foreground">
            E-mail *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e =>
              setFormData(prev => ({ ...prev, email: e.target.value }))
            }
            placeholder="seu@email.com"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand"
          />
        </div>

        {submitted && (
          <div className="bg-emerald-500/10 border border-emerald-500 rounded-lg p-4 flex items-center gap-2">
            <span className="text-emerald-500 font-semibold">✓</span>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Feedback enviado com sucesso! Obrigado pela contribuição.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-red-brand text-white font-semibold py-2.5 rounded-lg hover:bg-red-brand-dark transition"
        >
          Enviar Feedback
        </button>
      </form>
    </section>
  );
}

export default function Documentation() {
  return (
    <InfoPageLayout
      category="support"
      title="Documentação & Feedback"
      description="Guia de referência para implantação e uso do RED. Compartilhe feedback, reporte problemas ou sugira melhorias."
      updatedAt="18/04/2026"
      owner="Produto e Suporte RED"
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {documentationSections.map(section => (
          <article
            key={section.title}
            className="bg-card border border-border rounded-lg p-6 space-y-3"
          >
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {section.title}
            </h2>
            <ul className="space-y-2 font-body text-sm text-muted-foreground list-disc pl-5 leading-relaxed">
              {section.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <FeedbackSection />
    </InfoPageLayout>
  );
}
