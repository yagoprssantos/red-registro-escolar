import BrandTitleLogo from "@/components/BrandTitleLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const pathname = window.location.pathname;
  const isPlatformRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/teacher-dashboard") ||
    pathname.startsWith("/student-dashboard") ||
    pathname.startsWith("/guardian-dashboard") ||
    pathname.startsWith("/onboarding");

  if (isPlatformRoute) {
    return (
      <div className="min-h-screen w-full bg-muted/30 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
          <Card className="w-full border-border bg-card/95 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-brand/10 text-red-brand">
                <LayoutDashboard className="h-7 w-7" />
              </div>

              <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Plataforma RED
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold text-foreground">
                404
              </h1>
              <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">
                Módulo não encontrado
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-muted-foreground">
                Esta rota não existe no ambiente da plataforma. Volte para o
                dashboard para acessar os módulos válidos do seu perfil.
              </p>

              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="bg-red-brand hover:bg-red-brand-dark text-white"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Ir para o Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,17,32,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(31,58,95,0.14),transparent_30%),linear-gradient(135deg,var(--background),var(--muted))]" />
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
        <Card className="w-full border-border/70 bg-card/90 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.42)] backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-xl border border-border bg-background/80 px-3 py-2">
                <BrandTitleLogo
                  size="compact"
                  className="pointer-events-none"
                />
              </div>
            </div>

            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-brand/10 text-red-brand">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

            <h2 className="text-xl font-semibold text-foreground mb-4">
              Página não encontrada
            </h2>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Este endereço não existe no site público da RED. Você pode voltar
              para a Home e continuar a navegação pelas seções principais.
            </p>

            <div
              id="not-found-button-group"
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                onClick={() => setLocation("/")}
                className="bg-red-brand hover:bg-red-brand-dark text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
