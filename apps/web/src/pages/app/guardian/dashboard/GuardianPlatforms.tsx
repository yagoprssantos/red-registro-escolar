import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Link2 } from "lucide-react";

const FALLBACK_PLATFORMS = [
  { name: "Google Classroom", description: "Acesse turmas e tarefas do seu filho.", url: "https://classroom.google.com", emoji: "📚", colorGradient: "from-blue-500 to-blue-700" },
  { name: "SISEDU", description: "Sistema de Gestão Educacional do Ceará.", url: "https://sisedu.educacao.ce.gov.br", emoji: "🏫", colorGradient: "from-green-500 to-green-700" },
  { name: "SIC", description: "Consultas e informações do sistema educacional.", url: "https://sic.ceara.gov.br", emoji: "📋", colorGradient: "from-amber-500 to-amber-700" },
  { name: "Enem na Rede", description: "Plataforma de preparação para o ENEM.", url: "https://enemnapoliedro.com.br", emoji: "🎯", colorGradient: "from-purple-500 to-purple-700" },
  { name: "Conexão Educação", description: "Recursos educacionais e formação continuada.", url: "https://conexaoeducacao.educacao.ce.gov.br", emoji: "🌐", colorGradient: "from-red-500 to-red-700" },
];

export default function GuardianPlatforms() {
  const { data: platforms } = trpc.profiles.guardian.platforms.useQuery();

  const list = (platforms ?? []).length > 0
    ? (platforms ?? []).map(p => ({
        name: p.name,
        description: p.description ?? "",
        url: p.url,
        emoji: p.emoji ?? "🔗",
        colorGradient: p.colorGradient ?? "from-gray-500 to-gray-700",
      }))
    : FALLBACK_PLATFORMS;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Link2 className="size-5" />
        Plataformas Parceiras
      </h2>

      <p className="text-sm text-muted-foreground">
        Acesse as plataformas parceiras da escola para acompanhar e complementar
        os estudos do seu filho.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map(p => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.colorGradient} text-2xl shadow-sm`}
                  >
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold group-hover:text-red-brand transition-colors">
                        {p.name}
                      </h3>
                      <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
