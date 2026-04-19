import InfoPageLayout from "@/components/InfoPageLayout";
import { useState } from "react";

const helpTopics = [
  {
    title: "Acesso à conta",
    description:
      "Orientações para login, redefinição de senha, seleção de perfil e recuperação de acesso institucional.",
  },
  {
    title: "Uso da plataforma",
    description:
      "Boas práticas de navegação, preenchimento de fluxos e acompanhamento de dados escolares por perfil.",
  },
  {
    title: "Comunicação e contatos",
    description:
      "Como abrir solicitações, registrar contexto e acompanhar retorno entre escola, família e equipe de suporte.",
  },
  {
    title: "Privacidade e segurança",
    description:
      "Dúvidas sobre confidencialidade, proteção de dados e uso correto de informações sensíveis.",
  },
];

export default function HelpCenter() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    subject: "",
    description: "",
    priority: "normal",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário enviado:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        institution: "",
        subject: "",
        description: "",
        priority: "normal",
      });
    }, 3000);
  };

  return (
    <InfoPageLayout
      category="support"
      title="Central de Ajuda"
      description="Canal de referência para orientações de uso, resolução de dúvidas frequentes e encaminhamento de solicitações operacionais da plataforma RED."
      updatedAt="18/04/2026"
      owner="Suporte Operacional RED"
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {helpTopics.map(topic => (
          <article
            key={topic.title}
            className="bg-card border border-border rounded-lg p-6 space-y-3 hover:shadow-md transition-shadow"
          >
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {topic.title}
            </h2>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {topic.description}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
            Registre sua Solicitação
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Preencha o formulário abaixo para descrever seu problema ou dúvida.
            Responderemos em breve.
          </p>
        </div>

        {submitted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              ✓
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-emerald-900">
                Solicitação enviada com sucesso!
              </p>
              <p className="font-body text-xs text-emerald-800 mt-1">
                Você receberá uma confirmação no e-mail informado em breve.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand/50 transition-all"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand/50 transition-all"
                placeholder="seu.email@instituição.edu.br"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">
                Instituição
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={e =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand/50 transition-all"
                placeholder="Nome da escola"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={e =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand/50 transition-all cursor-pointer"
              >
                <option value="low">Baixa - Feedback geral</option>
                <option value="normal">Normal - Dúvida ou problema</option>
                <option value="high">Alta - Sistema fora do ar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-2">
              Assunto *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={e =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand/50 transition-all"
              placeholder="Ex: Dúvida sobre como registrar alunos"
            />
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-2">
              Descrição detalhada *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={5}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-brand/50 transition-all font-body text-sm resize-vertical"
              placeholder="Descreva seu problema em detalhes. Se possível, informe:
- Módulo ou página afetada
- Ações realizadas antes do problema
- Mensagens de erro exibidas
- Se o problema afeta outros usuários"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-brand text-white font-heading font-semibold py-3 rounded-lg hover:bg-red-brand-dark transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Enviar Solicitação
          </button>
        </form>
      </section>
    </InfoPageLayout>
  );
}

