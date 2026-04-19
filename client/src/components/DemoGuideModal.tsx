import { CircleHelp } from "lucide-react";

type DemoGuideModalProps = {
  profileTitle: string;
  open: boolean;
  onClose: () => void;
};

export default function DemoGuideModal({
  profileTitle,
  open,
  onClose,
}: DemoGuideModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-blue-brand/10 p-2 text-blue-brand">
            <CircleHelp size={18} />
          </div>
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Demo guiada
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
              Dashboard de {profileTitle} em modo demonstracao
            </h2>
          </div>
        </div>

        <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
          Esta visualizacao e uma base funcional para validar navegacao,
          autenticacao e organizacao dos modulos. Os dados exibidos aqui podem
          ser ficticios ou simplificados nesta etapa.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-background/70 p-3">
          <p className="font-body text-xs text-muted-foreground">
            Proximo passo: conectar estes blocos com dados reais de banco,
            formularios de registro e regras de negocio por perfil.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-red-brand px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-red-brand-dark"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
