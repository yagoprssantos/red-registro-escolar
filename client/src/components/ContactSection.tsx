/*
 * ContactSection — RED Registro Escolar Digital
 * Design: Fundo vermelho com formulário branco, layout assimétrico
 * Formulário de contato integrado com tRPC e banco de dados
 */

import { useState, useRef, useEffect } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    school: "",
    role: "",
    students: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const createContactMutation = trpc.contacts.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContactMutation.mutateAsync({
        name: form.name,
        email: form.email,
        school: form.school,
        role: form.role,
        students: form.students || undefined,
        message: form.message || undefined,
      });
      setSubmitted(true);
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <section id="contato" className="py-24 bg-red-brand relative overflow-hidden" ref={ref}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Info */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="w-14 h-0.5 bg-white/40 mb-4" />
            <span className="font-condensed font-bold text-xs text-white/60 tracking-widest uppercase mb-3 block">
              Contato
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Leve o RED para{" "}
              <span className="italic text-white/80">sua escola</span>
            </h2>
            <p className="font-body text-base text-white/80 leading-relaxed mb-10">
              Agende uma demonstração gratuita e descubra como o RED pode transformar 
              a gestão escolar da sua instituição. Nossa equipe está pronta para apresentar 
              a plataforma e responder todas as suas dúvidas.
            </p>

            <div className="flex flex-col gap-5 mb-10">
              {[
                {
                  icon: Phone,
                  label: "Telefone",
                  value: "(XX) 3000-0000",
                  href: "tel:+551130000000",
                },
                {
                  icon: Mail,
                  label: "E-mail",
                  value: "contato@redescolar.com.br",
                  href: "mailto:contato@redescolar.com.br",
                },
                {
                  icon: MapPin,
                  label: "Endereço",
                  value: "Fortaleza, CE — Brasil",
                  href: "#",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-sm bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                      <Icon size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-body text-xs text-white/60 uppercase tracking-wider">
                        {item.label}
                      </div>
                      <div className="font-heading font-medium text-white text-sm">
                        {item.value}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {["LGPD Compliant", "ISO 27001", "Suporte 24h", "Dados no Brasil"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="font-body text-xs text-white/80 border border-white/30 rounded-full px-3 py-1"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Right: Form */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="bg-white rounded-sm shadow-2xl p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    Mensagem Enviada!
                  </h3>
                  <p className="font-body text-sm text-gray-600 leading-relaxed">
                    Obrigado pelo interesse no RED. Nossa equipe entrará em contato em até 24 horas úteis para agendar sua demonstração.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", school: "", role: "", students: "", message: "" });
                    }}
                    className="mt-6 font-heading font-semibold text-sm text-red-brand hover:underline"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-heading font-bold text-gray-900 text-xl mb-6">
                    Solicitar Demonstração Gratuita
                  </h3>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-xs font-medium text-gray-700 block mb-1.5">
                          Nome completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Seu nome"
                          className="w-full font-body text-sm border border-gray-200 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-red-brand focus:ring-1 focus:ring-red-brand/20 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs font-medium text-gray-700 block mb-1.5">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="seu@email.com"
                          className="w-full font-body text-sm border border-gray-200 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-red-brand focus:ring-1 focus:ring-red-brand/20 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-body text-xs font-medium text-gray-700 block mb-1.5">
                        Nome da escola *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.school}
                        onChange={(e) => setForm({ ...form, school: e.target.value })}
                        placeholder="Nome da sua instituição"
                        className="w-full font-body text-sm border border-gray-200 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-red-brand focus:ring-1 focus:ring-red-brand/20 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-xs font-medium text-gray-700 block mb-1.5">
                          Seu cargo *
                        </label>
                        <select
                          required
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="w-full font-body text-sm border border-gray-200 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-red-brand focus:ring-1 focus:ring-red-brand/20 transition-colors bg-white"
                        >
                          <option value="">Selecione</option>
                          <option value="diretor">Diretor(a)</option>
                          <option value="coordenador">Coordenador(a)</option>
                          <option value="professor">Professor(a)</option>
                          <option value="secretario">Secretário(a)</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-xs font-medium text-gray-700 block mb-1.5">
                          Nº de alunos
                        </label>
                        <select
                          value={form.students}
                          onChange={(e) => setForm({ ...form, students: e.target.value })}
                          className="w-full font-body text-sm border border-gray-200 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-red-brand focus:ring-1 focus:ring-red-brand/20 transition-colors bg-white"
                        >
                          <option value="">Selecione</option>
                          <option value="ate100">Até 100</option>
                          <option value="100-500">100 a 500</option>
                          <option value="500-1000">500 a 1.000</option>
                          <option value="mais1000">Mais de 1.000</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-body text-xs font-medium text-gray-700 block mb-1.5">
                        Mensagem
                      </label>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Conte-nos sobre sua escola e suas necessidades..."
                        className="w-full font-body text-sm border border-gray-200 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-red-brand focus:ring-1 focus:ring-red-brand/20 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={createContactMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-red-brand text-white font-heading font-semibold text-sm py-3.5 rounded-sm hover:bg-[#6b0d19] disabled:bg-gray-400 transition-colors duration-200 shadow-sm hover:shadow-md mt-1"
                    >
                      {createContactMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Solicitar Demonstração Gratuita
                        </>
                      )}
                    </button>

                    <p className="font-body text-xs text-gray-400 text-center">
                      Ao enviar, você concorda com nossa{" "}
                      <span className="text-red-brand hover:underline cursor-pointer">
                        Política de Privacidade
                      </span>
                      . Seus dados estão protegidos pela LGPD.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
