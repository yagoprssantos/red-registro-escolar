import { trpc } from "@/lib/trpc";
import type { Student, StudentComment } from "@/pages/shared/Types";
import { useState } from "react";

const CATEGORIES = [
  { value: "all", label: "Todos" },
  { value: "elogio", label: "⭐ Elogio" },
  { value: "melhoria", label: "🔄 Melhoria" },
  { value: "ocorrencia", label: "⚠️ Ocorrência" },
  { value: "comentario", label: "💬 Comentário" },
] as const;

type GuardianComment = StudentComment & {
  teacherName?: string | null;
  authorName?: string | null;
};

export default function GuardianComments() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const studentList = (students ?? []) as Student[];

  const { data: comments } = trpc.comments.forStudent.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  const allComments = (comments ?? []) as GuardianComment[];
  const filtered =
    filterCategory === "all"
      ? allComments
      : allComments.filter(c => String(c.category) === filterCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Aluno:</label>
        <select
          value={selectedStudentId ?? ""}
          onChange={e => setSelectedStudentId(Number(e.target.value) || null)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {studentList.map(s => (
            <option key={String(s.id)} value={String(s.id)}>
              {String(s.name)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        Diferença vs aluno: nome do professor <strong>VISÍVEL</strong>
      </p>

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

      {selectedStudentId && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum comentário</p>
      )}

      <div className="space-y-2">
        {filtered.map(comment => {
          const cat = String(comment.category);
          const authorName = String(
            comment.teacherName || comment.authorName || "Professor"
          );
          const vis = String(comment.visibility);

          return (
            <div
              key={String(comment.id)}
              className="rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="text-xs font-semibold text-foreground">
                  Prof. {authorName}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {vis === "student"
                    ? "Aluno"
                    : vis === "guardian"
                      ? "Responsável"
                      : vis === "all"
                        ? "Todos"
                        : "Escola"}
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
