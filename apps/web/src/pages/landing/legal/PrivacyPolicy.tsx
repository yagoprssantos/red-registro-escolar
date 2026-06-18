import InfoPageLayout from "@/components/InfoPageLayout";

export default function PrivacyPolicy() {
  return (
    <InfoPageLayout
      category="legal"
      title="Política de Privacidade"
      description="Documento institucional que descreve como o RED trata dados pessoais no contexto educacional, incluindo finalidades, bases legais, compartilhamentos e direitos dos titulares."
      updatedAt="18/04/2026"
      owner="Governança e Privacidade RED"
    >
      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          1. Escopo e finalidade do tratamento
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Esta política se aplica a usuários da plataforma RED e descreve o
          tratamento de dados para cadastro, autenticação, operação acadêmica,
          comunicação entre escola e responsáveis, atendimento e melhoria dos
          serviços. O tratamento ocorre apenas para propósitos legítimos,
          informados e compatíveis com o contexto educacional.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            2. Categorias de dados tratados
          </h2>
          <ul className="space-y-2 font-body text-sm text-muted-foreground list-disc pl-5 leading-relaxed">
            <li>Dados de identificação e contato do usuário.</li>
            <li>Dados acadêmicos e administrativos vinculados ao perfil.</li>
            <li>Registros de acesso, autenticação e eventos operacionais.</li>
            <li>Conteúdo enviado em canais de comunicação e suporte.</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            3. Bases legais e salvaguardas
          </h2>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            O tratamento observa as bases legais aplicáveis na legislação
            vigente, incluindo execução de serviços, cumprimento de obrigação
            legal e legítimo interesse quando cabível. São adotadas medidas
            técnicas e administrativas para mitigar riscos de acesso indevido,
            perda, vazamento ou alteração não autorizada.
          </p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          4. Compartilhamento, armazenamento e retenção
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          O compartilhamento ocorre de forma restrita e proporcional, quando
          necessário para execução do serviço, cumprimento de obrigação legal ou
          suporte técnico de parceiros contratados sob dever de
          confidencialidade. Os dados são armazenados pelo período necessário às
          finalidades informadas e aos prazos regulatórios aplicáveis.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          5. Direitos dos titulares
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          O titular pode solicitar confirmação da existência de tratamento,
          acesso, correção, anonimização, bloqueio, eliminação de dados quando
          cabível, portabilidade e informações sobre compartilhamento, nos
          termos da legislação aplicável.
        </p>
      </section>

      <section className="bg-muted/50 border border-border rounded-lg p-6 lg:p-8 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          6. Canal de privacidade e comunicação
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Solicitações relacionadas a privacidade e proteção de dados podem ser
          enviadas pelos canais oficiais do RED e da instituição contratante. O
          atendimento será registrado e respondido em prazo compatível com a
          natureza da demanda e obrigações legais.
        </p>
      </section>
    </InfoPageLayout>
  );
}
