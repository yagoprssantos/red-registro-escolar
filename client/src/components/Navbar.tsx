/*
 * Navbar — RED Registro Escolar Digital
 * Design: Editorial Moderno — fundo branco, logo vermelho, links com hover animado
 * Sticky com sombra sutil ao scroll
 */

import BrandTitleLogo from "@/components/BrandTitleLogo";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { LogIn, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Contato", href: "#contato" },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-card shadow-md py-3" : "bg-card/95 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container flex items-center justify-between">
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
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={isHomePage ? link.href : `/${link.href}`}
              onClick={e => {
                if (isHomePage) {
                  e.preventDefault();
                  handleNavClick(link.href);
                }
              }}
              className="font-body text-sm font-medium text-muted-foreground animated-underline hover:text-red-brand transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {showThemeToggle ? <ThemeToggleButton /> : null}

          {/* Login Button - Prominent */}
          <a
            href="/profile-selector?source=navbar"
            className="font-heading font-semibold text-sm px-6 py-2.5 bg-red-brand text-white rounded-lg hover:bg-red-brand-dark transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2 group"
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
              className="font-heading font-semibold text-sm px-5 py-2.5 border-2 border-red-brand text-red-brand rounded-lg hover:bg-red-brand hover:text-white transition-colors duration-200"
            >
              Entrar em contato
            </a>
          ) : null}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-muted-foreground hover:text-red-brand transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-card border-t border-border shadow-lg">
          <nav className="container py-4 flex flex-col gap-1">
            <div className="flex items-center justify-between px-1 py-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Aparencia
              </span>
              {showThemeToggle ? <ThemeToggleButton compact /> : null}
            </div>

            {navLinks.map(link => (
              <a
                key={link.href}
                href={isHomePage ? link.href : `/${link.href}`}
                onClick={e => {
                  if (isHomePage) {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }
                }}
                className="font-body text-sm font-medium text-muted-foreground hover:text-red-brand hover:bg-muted/40 px-3 py-2.5 rounded transition-colors"
              >
                {link.label}
              </a>
            ))}

            {/* Mobile Login Button - Prominent */}
            <a
              href="/profile-selector?source=navbar-mobile"
              className="mt-3 font-heading font-semibold text-sm px-5 py-3 bg-red-brand text-white rounded-lg text-center hover:bg-red-brand-dark transition-colors w-full flex items-center justify-center gap-2 shadow-md"
            >
              <LogIn size={18} />
              <span>Acessar Plataforma</span>
            </a>

            {/* Mobile Contact Button */}
            {showContactButton ? (
              <a
                href={isHomePage ? "#contato" : "/#contato"}
                onClick={e => {
                  if (isHomePage) {
                    e.preventDefault();
                    handleNavClick("#contato");
                  }
                }}
                className="mt-2 font-heading font-semibold text-sm px-5 py-3 border-2 border-red-brand text-red-brand rounded-lg text-center hover:bg-red-brand hover:text-white transition-colors w-full"
              >
                Entrar em contato
              </a>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
