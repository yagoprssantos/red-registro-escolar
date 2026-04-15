/*
 * Home — RED Registro Escolar Digital
 * Design: Editorial Moderno — "Clareza Pedagógica"
 * Composição de todas as seções da landing page
 */

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DataSection from "@/components/DataSection";
import BenefitsSection from "@/components/BenefitsSection";
import CtaBanner from "@/components/CtaBanner";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import FloatingLoginButton from "@/components/FloatingLoginButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <FloatingLoginButton />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DataSection />
      <BenefitsSection />
      <CtaBanner />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
