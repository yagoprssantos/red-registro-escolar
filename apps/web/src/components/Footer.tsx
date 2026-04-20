/*
 * Footer — RED Registro Escolar Digital
 * Design: Fundo azul escuro, logo branco, presença institucional compacta
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card dark:bg-muted border-t border-border">
      <div className="container py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-8 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:gap-8 items-start">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-brand rounded-sm shadow-sm">
                <span className="font-condensed font-bold text-white text-lg tracking-wider">
                  R
                </span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-condensed font-bold text-foreground text-xl tracking-widest uppercase">
                  RED
                </span>
                <span className="font-body text-[10px] text-muted-foreground tracking-wider uppercase">
                  Registro Escolar Digital
                </span>
              </div>
            </div>

            <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-xs">
              Plataforma digital para centralizar registros escolares e
              fortalecer a comunicação entre escola e família.
            </p>

            <a
              href="https://instagram.com/registroescolardigital"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 w-fit rounded-sm bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 px-3 py-2 transition-colors text-foreground"
              aria-label="Instagram"
            >
              <span className="font-condensed font-bold text-foreground text-xs uppercase">
                Instagram
              </span>
            </a>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground text-sm mb-3 uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Funcionalidades", href: "/#funcionalidades" },
                { label: "Benefícios", href: "/#beneficios" },
                { label: "Contato", href: "/#contato" },
                {
                  label: "Acessar Plataforma",
                  href: "/profile-selector?source=footer",
                },
              ].map(item => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground text-sm mb-3 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                {
                  label: "Política de Privacidade",
                  href: "/legal/privacy-policy",
                },
                { label: "Termos de Uso", href: "/legal/terms" },
                { label: "Conformidade LGPD", href: "/legal/lgpd" },
              ].map(item => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground text-sm mb-3 uppercase tracking-wider">
              Suporte
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Central de Ajuda", href: "/support/help-center" },
                { label: "Documentação", href: "/support/documentation" },
                { label: "Status do Sistema", href: "/support/system-status" },
              ].map(item => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-center sm:text-left">
          <p className="font-body text-xs text-muted-foreground">
            © {currentYear} RED - Registro Escolar Digital.
          </p>
          <span className="font-body text-xs text-muted-foreground">
            Feito para a educação brasileira
          </span>
        </div>
      </div>
    </footer>
  );
}
