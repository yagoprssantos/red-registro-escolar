/*
 * Navbar — RED Registro Escolar Digital
 * Design: Editorial Moderno — fundo branco, logo vermelho, links com hover animado
 * Sticky com sombra sutil ao scroll
 */

import BrandTitleLogo from "@/components/BrandTitleLogo";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Contato", href: "#contato" },
];

const supportLinks = [
  { label: "Legal", href: "/legal/privacy-policy" },
  { label: "Suporte", href: "/support/help-center" },
];

type NavbarProps = {
  showThemeToggle?: boolean;
  showContactButton?: boolean;
};

export default function Navbar({
  showThemeToggle = true,
  showContactButton = true,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHomePage = window.location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);

    if (!isHomePage) {
      sessionStorage.setItem("homeScrollTarget", href);
      window.location.href = `/${href}`;
      return;
    }

    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/40 transition-all duration-300 ${
        scrolled ? "bg-card shadow-md" : "bg-card/95 backdrop-blur-sm"
      }`}
      style={{
        paddingTop: scrolled
          ? "clamp(0.5rem, 0.9vw, 0.8rem)"
          : "clamp(0.7rem, 1.1vw, 1rem)",
        paddingBottom: scrolled
          ? "clamp(0.5rem, 0.9vw, 0.8rem)"
          : "clamp(0.7rem, 1.1vw, 1rem)",
      }}
    >
      <div className="container flex min-h-[clamp(4rem,5vw,5.75rem)] items-center justify-between gap-[clamp(0.75rem,1.4vw,1.5rem)]">
        {/* Logo */}
        <BrandTitleLogo
          href={isHomePage ? "#inicio" : "/"}
          onClick={e => {
            if (isHomePage) {
              e.preventDefault();
              handleNavClick("#inicio");
            }
          }}
          size="compact"
        />

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-[clamp(1.25rem,1.8vw,2.25rem)]">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={isHomePage ? link.href : `/${link.href}`}
              onClick={e => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="font-body text-[clamp(0.875rem,0.7vw,0.98rem)] font-medium text-muted-foreground animated-underline hover:text-red-brand transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}

          {supportLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-[clamp(0.875rem,0.7vw,0.98rem)] font-medium text-muted-foreground animated-underline hover:text-red-brand transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-[clamp(0.65rem,1vw,0.9rem)]">
          {showThemeToggle ? <ThemeToggleButton /> : null}

          {/* Login Button - Prominent */}
          <a
            href="/profile-selector?source=navbar"
            className="font-heading font-semibold text-[clamp(0.82rem,0.65vw,0.95rem)] px-[clamp(1.1rem,1.8vw,1.5rem)] py-[clamp(0.6rem,0.95vw,0.8rem)] bg-red-brand text-white rounded-lg hover:bg-red-brand-dark transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-[clamp(0.4rem,0.6vw,0.5rem)] group"
          >
            <LogIn
              size={18}
              className="group-hover:rotate-12 transition-transform"
            />
            <span>Acessar Plataforma</span>
          </a>

          {/* Contact Button */}
          {showContactButton ? (
            <a
              href={isHomePage ? "#contato" : "/#contato"}
              onClick={e => {
                if (isHomePage) {
                  e.preventDefault();
                  handleNavClick("#contato");
                }
              }}
              className="font-heading font-semibold text-[clamp(0.82rem,0.65vw,0.95rem)] px-[clamp(1rem,1.5vw,1.35rem)] py-[clamp(0.6rem,0.95vw,0.8rem)] border-2 border-red-brand text-red-brand rounded-lg hover:bg-red-brand hover:text-white transition-colors duration-200"
            >
              Entrar em contato
            </a>
          ) : null}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden inline-flex items-center justify-center rounded-md p-[clamp(0.55rem,1vw,0.75rem)] text-muted-foreground hover:text-red-brand transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-nav"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              transition: { duration: 0.22, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              y: -12,
              height: 0,
              transition: { duration: 0.18, ease: "easeIn" },
            }}
            className="lg:hidden overflow-hidden bg-card border-t border-border shadow-lg"
          >
            <nav
              id="mobile-main-nav"
              className="container max-h-[calc(100svh-4.75rem)] overflow-y-auto py-3 flex flex-col gap-1"
            >
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut", delay: 0.03 }}
                className="flex items-center justify-between px-1 py-2"
              >
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aparencia
                </span>
                {showThemeToggle ? <ThemeToggleButton compact /> : null}
              </motion.div>

              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut", delay: 0.05 }}
                className="px-3 pt-2 pb-1 font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Navegação
              </motion.span>

              {navLinks.map((link, index) => (
                <motion.a
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    duration: 0.16,
                    ease: "easeOut",
                    delay: 0.07 + index * 0.03,
                  }}
                  key={link.href}
                  href={isHomePage ? link.href : `/${link.href}`}
                  onClick={e => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="font-body text-[15px] font-medium text-muted-foreground hover:text-red-brand hover:bg-muted/40 px-3 py-3 rounded transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut", delay: 0.2 }}
                className="px-3 pt-2 pb-1 font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Institucional
              </motion.span>

              {supportLinks.map((link, index) => (
                <motion.a
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    duration: 0.16,
                    ease: "easeOut",
                    delay: 0.22 + index * 0.03,
                  }}
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-body text-[15px] font-medium text-muted-foreground hover:text-red-brand hover:bg-muted/40 px-3 py-3 rounded transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.a
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut", delay: 0.3 }}
                href="/profile-selector?source=navbar-mobile"
                className="mt-3 font-heading font-semibold text-sm px-5 py-3.5 bg-red-brand text-white rounded-lg text-center hover:bg-red-brand-dark transition-colors w-full flex items-center justify-center gap-2 shadow-md"
              >
                <LogIn size={18} />
                <span>Acessar Plataforma</span>
              </motion.a>

              {showContactButton ? (
                <motion.a
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: "easeOut", delay: 0.33 }}
                  href={isHomePage ? "#contato" : "/#contato"}
                  onClick={e => {
                    if (isHomePage) {
                      e.preventDefault();
                      handleNavClick("#contato");
                    }
                  }}
                  className="mt-2 mb-1 font-heading font-semibold text-sm px-5 py-3.5 border-2 border-red-brand text-red-brand rounded-lg text-center hover:bg-red-brand hover:text-white transition-colors w-full"
                >
                  Entrar em contato
                </motion.a>
              ) : null}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
