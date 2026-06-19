import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "elogio", label: "⭐ Elogio", color: "text-green-600" },
  { value: "melhoria", label: "🔄 Melhoria", color: "text-amber-600" },
  { value: "ocorrencia", label: "⚠️ Ocorrência", color: "text-red-500" },
  { value: "comentario", label: "💬 Comentário", color: "text-blue-600" },
] as const;

const VISIBILITIES = [
  { value: "student", label: "Aluno", desc: "Aluno vê sem seu nome" },
  {
    value: "guardian",
    label: "Responsável",
    desc: "Responsável vê com seu nome",
  },
  {
    value: "all",
    label: "Todos",
    desc: "Aluno (sem nome) + Responsável (com nome)",
  },
  { value: "school", label: "Apenas escola", desc: "Só gestão vê" },
] as const;

type Tab = "new" | "history";

export default function TeacherComments() {
  const [tab, setTab] = useState<Tab>("new");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("comentario");
  const [visibility, setVisibility] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");

  const { data: teacherProfile } = trpc.profiles.teacher.me.useQuery();
  const { data: classes } = trpc.profiles.teacher.classes.useQuery();
  const classList = (classes ?? []) as RegistryRow[];

  // Get students from teacher's classes
  const classIds = classList.map(c => c.id as number);
  const { data: enrollments } = trpc.registry.list.useQuery({
    entity: "classEnrollments" as const,
    limit: 500,
  });
  const { data: studentRecords } = trpc.registry.list.useQuery({
    entity: "students" as const,
    limit: 500,
  });

  const enrollmentList = (enrollments ?? []) as RegistryRow[];
  const allStudents = (studentRecords ?? []) as RegistryRow[];

  // Filter students to only those in teacher's classes
  const myStudentIds = new Set(
    enrollmentList
      .filter(e => classIds.includes(e.classId as number))
      .map(e => e.studentId as number)
  );
  const myStudents = allStudents.filter(s => myStudentIds.has(s.id as number));

  // History: comments by teacher
  const { data: comments } = trpc.comments.byTeacher.useQuery(
    { teacherId: teacherProfile?.id ?? 0 },
    { enabled: tab === "history" && !!teacherProfile }
  );
  const commentList = ((comments ?? []) as RegistryRow[]).filter(c => {
    if (filterCategory !== "all" && String(c.category) !== filterCategory)
      return false;
    if (
      searchStudent &&
      !String(c.studentName || "")
        .toLowerCase()
        .includes(searchStudent.toLowerCase())
    )
      return false;
    return true;
  });

  const createComment = trpc.comments.create.useMutation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudentId || !content.trim()) return;

    try {
      await createComment.mutateAsync({
        studentId: selectedStudentId,
        content: content.trim(),
        category: category as
          | "elogio"
          | "melhoria"
          | "ocorrencia"
          | "comentario",
        visibility: visibility as "student" | "guardian" | "school" | "all",
      });
      toast.success("Comentário publicado!");
      setContent("");
      setSelectedStudentId(null);
    } catch {
      toast.error("Erro ao publicar comentário");
    }
  }

  const selectedVis = VISIBILITIES.find(v => v.value === visibility);

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("new")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "new"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Novo Comentário
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Histórico
        </button>
      </div>

      {tab === "new" && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Comentário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Aluno</label>
                <select
                  value={selectedStudentId ?? ""}
                  onChange={e => setSelectedStudentId(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {myStudents.map(s => (
                    <option key={String(s.id)} value={String(s.id)}>
                      {String(s.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
                        category === cat.value
                          ? "bg-muted text-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Visibilidade
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {VISIBILITIES.map(v => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setVisibility(v.value)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors min-h-[44px] ${
                        visibility === v.value
                          ? "border-foreground bg-muted"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium">{v.label}</span>
                      <p className="text-xs text-muted-foreground">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Comentário
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="Escreva seu comentário..."
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {content.length}/2000
                </p>
              </div>

              {selectedVis && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  👁️ Quem vê: {selectedVis.desc}
                </div>
              )}

              <Button
                type="submit"
                className="bg-red-brand hover:bg-red-700"
                disabled={createComment.isPending || !selectedStudentId}
              >
                {createComment.isPending
                  ? "Publicando..."
                  : "Publicar Comentário"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por aluno..."
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              className="max-w-xs rounded-lg border bg-background px-3 py-1.5 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterCategory("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filterCategory === "all"
                    ? "bg-muted text-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                Todos
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filterCategory === cat.value
                      ? "bg-muted text-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comments list */}
          {commentList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum comentário encontrado
            </p>
          )}
          <div className="space-y-2">
            {commentList.map(comment => {
              const cat = String(comment.category);
              const vis = String(comment.visibility);
              return (
                <div
                  key={String(comment.id)}
                  className="rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {Boolean(comment.studentName) && (
                      <span className="text-xs text-foreground">
                        — {String(comment.studentName)}
                      </span>
                    )}
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
                        ? new Date(
                            String(comment.createdAt)
                          ).toLocaleDateString("pt-BR")
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
      )}
    </div>
  );
}
