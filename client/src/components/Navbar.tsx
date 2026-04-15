/*
 * Navbar — RED Registro Escolar Digital
 * Design: Editorial Moderno — fundo branco, logo vermelho, links com hover animado
 * Sticky com sombra sutil ao scroll
 */

import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-md py-3"
          : "bg-white/95 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <a
          href="#inicio"
          onClick={(e) => { e.preventDefault(); handleNavClick("#inicio"); }}
          className="flex items-center gap-3 group"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-red-brand rounded-sm shadow-sm group-hover:shadow-md transition-shadow">
            <span className="font-condensed font-bold text-white text-lg tracking-wider">R</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-condensed font-bold text-red-brand text-xl tracking-widest uppercase">RED</span>
            <span className="font-body text-[10px] text-gray-500 tracking-wider uppercase">Registro Escolar Digital</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              className="font-body text-sm font-medium text-gray-700 animated-underline hover:text-red-brand transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Login Button - Prominent */}
          <a
            href="/profile-selector"
            className="font-heading font-semibold text-sm px-6 py-2.5 bg-red-brand text-white rounded-lg hover:bg-[#6b0d19] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2 group"
          >
            <LogIn size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Acessar Plataforma</span>
          </a>
          
          {/* Demo Button */}
          <a
            href="#contato"
            onClick={(e) => { e.preventDefault(); handleNavClick("#contato"); }}
            className="font-heading font-semibold text-sm px-5 py-2.5 border-2 border-red-brand text-red-brand rounded-lg hover:bg-red-brand hover:text-white transition-colors duration-200"
          >
            Solicitar Demo
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-gray-700 hover:text-red-brand transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                className="font-body text-sm font-medium text-gray-700 hover:text-red-brand hover:bg-gray-50 px-3 py-2.5 rounded transition-colors"
              >
                {link.label}
              </a>
            ))}
            
            {/* Mobile Login Button - Prominent */}
            <a
              href="/profile-selector"
              className="mt-3 font-heading font-semibold text-sm px-5 py-3 bg-red-brand text-white rounded-lg text-center hover:bg-[#6b0d19] transition-colors w-full flex items-center justify-center gap-2 shadow-md"
            >
              <LogIn size={18} />
              <span>Acessar Plataforma</span>
            </a>
            
            {/* Mobile Demo Button */}
            <a
              href="#contato"
              onClick={(e) => { e.preventDefault(); handleNavClick("#contato"); }}
              className="mt-2 font-heading font-semibold text-sm px-5 py-3 border-2 border-red-brand text-red-brand rounded-lg text-center hover:bg-red-brand hover:text-white transition-colors w-full"
            >
              Solicitar Demo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
