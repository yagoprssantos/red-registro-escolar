import InfoPageLayout from "@/components/InfoPageLayout";

const services = [
  { name: "Aplicação Web", status: "Operacional" },
  { name: "Autenticação", status: "Operacional" },
  { name: "API de Dados", status: "Operacional" },
  { name: "Notificações", status: "Operacional" },
  { name: "Formulários de Contato", status: "Operacional" },
];

export default function SystemStatus() {
  return (
    <InfoPageLayout
      category="support"
      title="Status do Sistema"
      description="Painel institucional de disponibilidade dos serviços essenciais da RED, com visão consolidada do estado operacional atual."
      updatedAt="18/04/2026"
      owner="Operações de Plataforma RED"
    >
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Serviços monitorados
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Atualização institucional periódica conforme operação.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Operando normalmente
          </span>
        </div>

        <div className="divide-y divide-border">
          {services.map(service => (
            <div
              key={service.name}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <span className="font-body text-sm font-medium text-foreground">
                {service.name}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Observações
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Em caso de manutenção programada, indisponibilidade temporária ou
          incidentes relevantes, esta página poderá ser atualizada com detalhes
          adicionais para apoiar usuários e instituições parceiras, incluindo
          escopo afetado, horário previsto e medidas de mitigação.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Diretrizes de comunicação de incidentes
        </h2>
        <ul className="space-y-2 font-body text-sm text-muted-foreground list-disc pl-5 leading-relaxed">
          <li>Publicação de alerta inicial após confirmação do incidente.</li>
          <li>Atualizações regulares enquanto houver impacto relevante.</li>
          <li>Publicação de encerramento com resumo e ações preventivas.</li>
        </ul>
      </section>
    </InfoPageLayout>
  );
}

