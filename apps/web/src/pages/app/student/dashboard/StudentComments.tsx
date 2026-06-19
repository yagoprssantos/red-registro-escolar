import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { useState } from "react";

const CATEGORIES = [
  { value: "all", label: "Todos" },
  { value: "elogio", label: "⭐ Elogio" },
  { value: "melhoria", label: "🔄 Melhoria" },
  { value: "ocorrencia", label: "⚠️ Ocorrência" },
  { value: "comentario", label: "💬 Comentário" },
] as const;

export default function StudentComments() {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { data: profile } = trpc.profiles.student.me.useQuery();
  const { data: comments } = trpc.comments.forStudent.useQuery(
    { studentId: profile?.id ?? 0 },
    { enabled: !!profile }
  );

  const allComments = (comments ?? []) as RegistryRow[];
  const filtered =
    filterCategory === "all"
      ? allComments
      : allComments.filter(c => String(c.category) === filterCategory);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Comentários</h2>
      <p className="text-xs text-muted-foreground">
        O nome do professor não é exibido para alunos
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterCategory === cat.value
                ? "bg-muted text-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum comentário recebido
        </p>
      )}

      <div className="space-y-2">
        {filtered.map(comment => {
          const cat = String(comment.category);
          return (
            <div
              key={String(comment.id)}
              className="rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {cat === "elogio"
                    ? "⭐"
                    : cat === "melhoria"
                      ? "🔄"
                      : cat === "ocorrencia"
                        ? "⚠️"
                        : "💬"}
                </span>
                <span className="text-xs font-medium capitalize text-muted-foreground">
                  {cat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.createdAt
                    ? new Date(String(comment.createdAt)).toLocaleDateString(
                        "pt-BR"
                      )
                    : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">
                {String(comment.content)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
