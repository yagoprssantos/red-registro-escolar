/*
 * CtaBanner — RED Registro Escolar Digital
 * Design: Banner horizontal com fundo azul escuro, texto branco, botão vermelho
 */

import { ArrowRight } from "lucide-react";

export default function CtaBanner() {
  const scrollToContact = () => {
    document.querySelector("#contato")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 bg-blue-brand dark:bg-blue-brand-dark relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Red accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-brand" />

      <div className="container relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
              Pronto para digitalizar sua escola?
            </h2>
            <p className="font-body text-base text-white/75 leading-relaxed">
              Junte-se a mais de 500 escolas que já transformaram sua gestão com
              o RED. Entre em contato com nossa equipe para saber mais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <button
              onClick={scrollToContact}
              className="inline-flex items-center justify-center gap-2 bg-red-brand text-white font-heading font-semibold text-sm px-8 py-4 rounded-sm hover:bg-red-brand-dark transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Entrar em contato
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              onClick={() =>
                document
                  .querySelector("#funcionalidades")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-heading font-semibold text-sm px-8 py-4 rounded-sm hover:bg-white/10 transition-all duration-200"
            >
              Ver Funcionalidades
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
