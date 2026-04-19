import InfoPageLayout from "@/components/InfoPageLayout";

export default function TermsOfUse() {
  return (
    <InfoPageLayout
      category="legal"
      title="Termos de Uso"
      description="Conjunto de regras que disciplina o acesso e o uso da plataforma RED por usuários, instituições parceiras e equipes operacionais."
      updatedAt="18/04/2026"
      owner="Governança de Produto RED"
    >
      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          1. Aceitação dos termos
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Ao acessar ou utilizar a plataforma, o usuário declara ciência e
          concordância com estes Termos. Caso não concorde com qualquer
          disposição, o uso deve ser interrompido imediatamente.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            2. Deveres do usuário
          </h2>
          <ul className="space-y-2 font-body text-sm text-muted-foreground list-disc pl-5 leading-relaxed">
            <li>Manter sigilo de credenciais e dispositivos de acesso.</li>
            <li>Fornecer dados corretos, completos e atualizados.</li>
            <li>Respeitar políticas internas da instituição de ensino.</li>
            <li>Utilizar o serviço exclusivamente para fins legítimos.</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            3. Uso permitido e restrições
          </h2>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            É permitido o uso para gestão escolar, comunicação institucional,
            acompanhamento pedagógico e rotinas administrativas vinculadas à
            operação educacional. É vedado o uso para atividades ilícitas,
            tentativa de fraude, engenharia reversa, exploração de
            vulnerabilidades ou violação de direitos de terceiros.
          </p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          4. Limitação de responsabilidade
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          A RED envida esforços razoáveis para manter disponibilidade, segurança
          e confiabilidade, sem garantia de operação ininterrupta ou isenta de
          falhas. A responsabilidade da plataforma observa os limites legais
          aplicáveis e a natureza dos serviços contratados.
        </p>
      </section>

      <section className="bg-muted/50 border border-border rounded-lg p-6 lg:p-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          5. Vigência, atualização e contato
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Estes termos podem ser revisados para refletir mudanças regulatórias,
          técnicas ou de operação. A versão vigente será publicada nesta página
          com data de atualização. Dúvidas contratuais ou operacionais podem ser
          encaminhadas pelos canais institucionais de suporte.
        </p>
      </section>
    </InfoPageLayout>
  );
}
