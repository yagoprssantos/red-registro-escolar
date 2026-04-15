/*
 * Footer — RED Registro Escolar Digital
 * Design: Fundo azul escuro, logo branco, links organizados em colunas
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-blue-brand text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-brand rounded-sm shadow-sm">
                <span className="font-condensed font-bold text-white text-lg tracking-wider">R</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-condensed font-bold text-white text-xl tracking-widest uppercase">RED</span>
                <span className="font-body text-[10px] text-white/50 tracking-wider uppercase">Registro Escolar Digital</span>
              </div>
            </div>
            <p className="font-body text-sm text-white/60 leading-relaxed mb-5">
              Plataforma digital integrada para centralizar registros escolares e fortalecer a conexão entre escola e família.
            </p>
            <div className="flex gap-3">
              {["in", "f", "ig"].map((social) => (
                <button
                  key={social}
                  className="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label={`Rede social ${social}`}
                >
                  <span className="font-condensed font-bold text-white text-xs uppercase">{social}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4 uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: "Funcionalidades", id: "#funcionalidades" },
                { label: "Como Funciona", id: "#como-funciona" },
                { label: "Benefícios", id: "#beneficios" },
                { label: "Depoimentos", id: "#depoimentos" },
                { label: "Solicitar Demo", id: "#contato" },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="font-body text-sm text-white/60 hover:text-white transition-colors animated-underline"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4 uppercase tracking-wider">
              Soluções
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                "Gestão Acadêmica",
                "Comunicação Escola-Família",
                "Relatórios Pedagógicos",
                "Controle de Frequência",
                "Registro Comportamental",
                "Documentos Digitais",
              ].map((item) => (
                <li key={item}>
                  <span className="font-body text-sm text-white/60">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4 uppercase tracking-wider">
              Legal e Suporte
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                "Política de Privacidade",
                "Termos de Uso",
                "Conformidade LGPD",
                "Central de Ajuda",
                "Documentação",
                "Status do Sistema",
              ].map((item) => (
                <li key={item}>
                  <span className="font-body text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-white/40">
            © {currentYear} RED — Registro Escolar Digital. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-body text-xs text-white/40">
              Desenvolvido com foco na educação brasileira
            </span>
            <span className="text-white/20">•</span>
            <span className="font-body text-xs text-white/40">
              LGPD Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
