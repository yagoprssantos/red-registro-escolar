import InfoPageLayout from "@/components/InfoPageLayout";

export default function LGPDCompliance() {
  return (
    <InfoPageLayout
      category="legal"
      title="Conformidade LGPD"
      description="Resumo executivo das práticas adotadas para conformidade com a Lei Geral de Proteção de Dados no contexto da operação da plataforma RED."
      updatedAt="18/04/2026"
      owner="Comitê de Privacidade RED"
    >
      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          1. Princípios de proteção de dados
        </h2>
        <ul className="space-y-2 font-body text-sm text-muted-foreground list-disc pl-5 leading-relaxed">
          <li>Finalidade e necessidade no tratamento de dados.</li>
          <li>Transparência sobre o uso das informações.</li>
          <li>Segurança, prevenção e mitigação de riscos.</li>
          <li>Responsabilização e prestação de contas.</li>
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            2. Medidas de segurança e governança
          </h2>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            A plataforma utiliza práticas de controle de acesso, segregação de
            perfis, registro de eventos relevantes e comunicação protegida para
            reduzir riscos operacionais e preservar a integridade dos dados,
            além de monitoramento contínuo para aprimoramento de controles.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            3. Papéis e responsabilidades
          </h2>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            A escola e seus responsáveis legais definem finalidades e bases de
            tratamento conforme sua operação, enquanto o RED atua como provedor
            tecnológico e apoia a execução segura do serviço, conforme
            obrigações contratuais e legais aplicáveis.
          </p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          4. Atendimento de direitos dos titulares
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          O titular pode requerer informações sobre tratamento, confirmação de
          existência de dados, correções e outras solicitações cabíveis pelos
          canais oficiais de contato. A análise e resposta seguem critérios de
          identidade, legitimidade e prazo legal.
        </p>
      </section>

      <section className="bg-muted/50 border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          5. Incidentes e canal de privacidade
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Em caso de incidente de segurança ou demanda de privacidade, utilize
          os canais oficiais de suporte do RED e da instituição contratante para
          registro, triagem e acompanhamento formal.
        </p>
      </section>
    </InfoPageLayout>
  );
}
