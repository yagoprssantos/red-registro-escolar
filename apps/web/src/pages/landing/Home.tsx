/*
 * Home — RED Registro Escolar Digital
 * Design: Editorial Moderno — "Clareza Pedagógica"
 * Composição de todas as seções da landing page
 */

import BenefitsSection from "@/components/BenefitsSection";
import ContactSection from "@/components/ContactSection";
import CtaBanner from "@/components/CtaBanner";
import FeaturesSection from "@/components/FeaturesSection";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import { useEffect } from "react";

function scrollToSection(selector: string) {
  const target = document.querySelector(selector);
  if (!target) return;

  const navbarOffset = Math.ceil(
    document.querySelector("header")?.getBoundingClientRect().height ?? 88
  );
  const top =
    target.getBoundingClientRect().top + window.scrollY - navbarOffset;

  window.scrollTo({ top, behavior: "smooth" });
}

export default function Home() {
  useEffect(() => {
    const savedTarget = sessionStorage.getItem("homeScrollTarget");
    const hashTarget = window.location.hash;
    const target = savedTarget || hashTarget;

    if (!target) return;

    const runScroll = () => scrollToSection(target);

    requestAnimationFrame(runScroll);
    setTimeout(runScroll, 250);

    if (savedTarget) {
      sessionStorage.removeItem("homeScrollTarget");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showThemeToggle={false} showContactButton={false} />
      <FloatingThemeToggle />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CtaBanner />
      <ContactSection />
      <Footer />
    </div>
  );
}
