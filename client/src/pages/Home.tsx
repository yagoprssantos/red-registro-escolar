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

export default function Home() {
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
