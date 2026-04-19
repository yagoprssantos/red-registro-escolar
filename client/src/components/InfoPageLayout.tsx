import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  Activity,
  ArrowLeft,
  BookOpenText,
  FileText,
  HelpCircle,
  LifeBuoy,
  Scale,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { ReactNode } from "react";

interface InfoPageLayoutProps {
  category: "legal" | "support";
  eyebrow?: string;
  title: string;
  description: string;
  updatedAt: string;
  owner?: string;
  children: ReactNode;
}

const sectionLinks = {
  legal: [
    {
      label: "Política de Privacidade",
      href: "/legal/privacy-policy",
      icon: Shield,
    },
    { label: "Termos de Uso", href: "/legal/terms", icon: FileText },
    { label: "Conformidade LGPD", href: "/legal/lgpd", icon: Scale },
  ],
  support: [
    {
      label: "Central de Ajuda",
      href: "/support/help-center",
      icon: LifeBuoy,
    },
    {
      label: "Documentação",
      href: "/support/documentation",
      icon: BookOpenText,
    },
    {
      label: "Status do Sistema",
      href: "/support/system-status",
      icon: Activity,
    },
  ],
} as const;

const categoryInfo = {
  legal: {
    label: "Base legal e governança",
    icon: FileText,
  },
  support: {
    label: "Operação e suporte da plataforma",
    icon: HelpCircle,
  },
};

export default function InfoPageLayout({
  category,
  eyebrow,
  title,
  description,
  updatedAt,
  owner = "Equipe RED",
  children,
}: InfoPageLayoutProps) {
  const pathname = window.location.pathname;
  const links = sectionLinks[category];
  const info = categoryInfo[category];
  const CategoryIcon = info.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-red-brand text-white pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b1120] via-[#8b1120] to-[#6b0d19]" />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-5xl space-y-8 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-body text-sm font-medium text-white hover:bg-white/15 transition-colors"
              >
                <ArrowLeft size={16} />
                Voltar para a página inicial
              </a>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-body text-xs font-semibold uppercase tracking-wider text-white/90">
                <CategoryIcon size={14} />
                {info.label}
              </span>
            </div>

            <header className="space-y-4 mx-auto max-w-4xl">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
                {eyebrow}
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-3xl lg:text-5xl font-bold text-white leading-tight">
                  {title}
                </h1>
                <p className="font-body text-base lg:text-lg text-white/85 leading-relaxed max-w-3xl mx-auto">
                  {description}
                </p>
              </div>
            </header>

            <div className="grid gap-3 sm:grid-cols-3 max-w-4xl mx-auto">
              {links.map(link => {
                const isCurrent = pathname === link.href;
                const LinkIcon: LucideIcon = link.icon;

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`group rounded-xl border px-4 py-3 transition-all duration-200 ${
                      isCurrent
                        ? "border-white bg-white text-red-brand shadow-lg"
                        : "border-white/30 bg-white/10 text-white hover:bg-white/18 hover:shadow-md"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold">
                      <LinkIcon
                        size={16}
                        className={
                          isCurrent ? "text-red-brand" : "text-white/90"
                        }
                      />
                      {link.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="container -mt-8 pb-16 lg:pb-20 relative z-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card shadow-sm p-6 lg:p-8 space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-3 border-b border-border pb-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpenText size={14} />
              Documento institucional
            </span>

            <div className="flex items-center gap-3">
              <span className="font-body text-xs text-muted-foreground">
                Atualizado em {updatedAt}
              </span>
              <span className="font-body text-xs text-muted-foreground">•</span>
              <span className="font-body text-xs text-muted-foreground">
                Responsável: {owner}
              </span>
            </div>
          </div>

          <div className="space-y-6">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
