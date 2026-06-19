import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  FileText,
  Lock,
  PlusCircle,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

type MainTab = "provas" | "tarefas" | "resumo";

type GradeEntry = { score: string; feedback: string };

function gradeColor(v: number) {
  if (v >= 7) return "text-green-600";
  if (v >= 5) return "text-amber-600";
  return "text-red-500";
}

// ─── Create Assessment Modal ──────────────────────────────────────────────────
function CreateAssessmentForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: { title: string; maxScore: number; weight: number; assessmentDate: string; description: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState(10);
  const [weight, setWeight] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" /> Nova Prova / Avaliação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => { e.preventDefault(); onSubmit({ title, maxScore, weight, assessmentDate: date, description }); }}
          className="space-y-3"
        >
          <Input placeholder="Título da avaliação" value={title} onChange={e => setTitle(e.target.value)} required />
          <Input placeholder="Descrição / instruções (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nota máxima</label>
              <Input type="number" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min={1} max={100} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Peso</label>
              <Input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={1} max={10} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="bg-red-brand hover:bg-red-700" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Avaliação"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Create Task Form ────────────────────────────────────────────────────────
function CreateTaskForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: { title: string; description: string; taskType: "trabalho" | "atividade"; dueDate: string; maxScore: number }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"trabalho" | "atividade">("atividade");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [maxScore, setMaxScore] = useState(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" /> Nova Tarefa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => { e.preventDefault(); onSubmit({ title, description, taskType, dueDate, maxScore }); }}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
            <div className="flex gap-2">
              {(["atividade", "trabalho"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaskType(t)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    taskType === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  {t === "atividade" ? "📝 Atividade" : "📁 Trabalho"}
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Título da tarefa" value={title} onChange={e => setTitle(e.target.value)} required />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {taskType === "atividade" ? "Enunciado / Instruções (aluno responde online)" : "Descrição / Instruções"}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder={
                taskType === "atividade"
                  ? "Escreva o enunciado da atividade aqui. O aluno responderá diretamente no sistema..."
                  : "Descreva o trabalho, como entregar, etc..."
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Prazo</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nota máxima</label>
              <Input type="number" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min={1} max={100} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="bg-red-brand hover:bg-red-700" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Tarefa"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Task Submissions Viewer ─────────────────────────────────────────────────
function TaskSubmissionsPanel({
  task,
  submissions,
  enrolledStudents,
  onBack,
  onGrade,
  onClose,
  onReopen,
  isPendingClose,
  isPendingReopen,
}: {
  task: RegistryRow;
  submissions: RegistryRow[];
  enrolledStudents: RegistryRow[];
  onBack: () => void;
  onGrade: (submissionId: number, score: number, feedback: string) => Promise<void>;
  onClose: () => void;
  onReopen: () => void;
  isPendingClose: boolean;
  isPendingReopen: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "submitted" | "pending" | "late">("all");
  const [grading, setGrading] = useState<Record<number, { score: string; feedback: string }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const now = new Date().toISOString().split("T")[0];
  const isLate = String(task.dueDate ?? "") < now;
  const isClosed = !!task.closedAt;
  const maxScore = Number(task.maxScore ?? 10);

  const byStudent = enrolledStudents.map(student => {
    const sub = submissions.find(s => s.studentId === student.id);
    const late = !sub && isLate;
    return { student, sub: sub ?? null, late };
  });

  const filtered = byStudent.filter(({ sub, late }) => {
    if (filter === "submitted") return !!sub?.submittedAt;
    if (filter === "pending") return !sub?.submittedAt && !late;
    if (filter === "late") return late;
    return true;
  });

  const submittedCount = byStudent.filter(x => !!x.sub?.submittedAt).length;
  const gradedCount = byStudent.filter(x => !!x.sub?.gradedAt).length;

  async function handleSaveGrade(subId: number) {
    const entry = grading[subId];
    if (!entry) return;
    const score = parseFloat(entry.score);
    if (isNaN(score) || score < 0 || score > maxScore) {
      toast.error(`Nota inválida (0 a ${maxScore})`);
      return;
    }
    setSavingId(subId);
    try {
      await onGrade(subId, score, entry.feedback);
      setGrading(prev => { const n = { ...prev }; delete n[subId]; return n; });
      toast.success("Nota salva!");
    } catch {
      toast.error("Erro ao salvar nota");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{String(task.title)}</h3>
          <p className="text-xs text-muted-foreground">
            {String(task.taskType === "atividade" ? "Atividade" : "Trabalho")} · Prazo:{" "}
            {task.dueDate ? new Date(String(task.dueDate) + "T00:00:00").toLocaleDateString("pt-BR") : "—"} · Valor: {maxScore} pts
          </p>
        </div>
        {isClosed ? (
          <Button size="sm" variant="outline" onClick={onReopen} disabled={isPendingReopen}>
            <Lock className="size-3.5 mr-1" /> {isPendingReopen ? "Reabrindo..." : "Reabrir"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={onClose} disabled={isPendingClose}>
            {isPendingClose ? "Fechando..." : "Fechar Tarefa"}
          </Button>
        )}
      </div>

      {task.description && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground whitespace-pre-wrap">
            {String(task.description)}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Matriculados", value: enrolledStudents.length, color: "text-foreground" },
          { label: "Responderam", value: submittedCount, color: "text-green-600" },
          { label: "Avaliados", value: gradedCount, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
        {[
          { key: "all" as const, label: `Todos (${byStudent.length})` },
          { key: "submitted" as const, label: `Respondidos (${submittedCount})` },
          { key: "pending" as const, label: `Pendentes (${byStudent.filter(x => !x.sub?.submittedAt && !x.late).length})` },
          { key: "late" as const, label: `Atrasados (${byStudent.filter(x => x.late).length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${filter === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum registro encontrado</p>
        )}
        {filtered.map(({ student, sub, late }) => {
          const subId = sub?.id as number | undefined;
          const alreadyGraded = !!sub?.gradedAt;
          const gEntry = subId ? grading[subId] : undefined;

          return (
            <Card key={String(student.id)} className={late ? "border-amber-200" : ""}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{String(student.name)}</span>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                    alreadyGraded
                      ? "bg-green-100 text-green-700"
                      : sub?.submittedAt
                        ? "bg-blue-100 text-blue-700"
                        : late
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                  }`}>
                    {alreadyGraded ? `✅ Avaliado: ${sub?.score}/${maxScore}` : sub?.submittedAt ? "📩 Respondeu" : late ? "⚠️ Atrasado" : "⏳ Pendente"}
                  </span>
                </div>

                {sub?.answer && (
                  <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {String(sub.answer)}
                  </div>
                )}

                {sub?.feedback && alreadyGraded && (
                  <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 px-3 py-2 text-xs text-green-800 dark:text-green-300">
                    <span className="font-medium">Feedback anterior: </span>{String(sub.feedback)}
                  </div>
                )}

                {subId && (
                  <div className="space-y-2 border-t pt-2 mt-1">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {alreadyGraded ? "Alterar nota" : "Nota"} (0–{maxScore})
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={maxScore}
                          step={0.1}
                          placeholder={alreadyGraded ? String(sub?.score ?? "") : "0"}
                          value={gEntry?.score ?? ""}
                          onChange={e => setGrading(prev => ({ ...prev, [subId]: { score: e.target.value, feedback: gEntry?.feedback ?? "" } }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="bg-red-brand hover:bg-red-700"
                        disabled={savingId === subId || !gEntry?.score}
                        onClick={() => handleSaveGrade(subId)}
                      >
                        {savingId === subId ? "..." : alreadyGraded ? "Atualizar" : "Avaliar"}
                      </Button>
                    </div>
                    <textarea
                      value={gEntry?.feedback ?? ""}
                      onChange={e => setGrading(prev => ({ ...prev, [subId]: { score: gEntry?.score ?? "", feedback: e.target.value } }))}
                      rows={2}
                      placeholder="Comentário / feedback para o aluno (opcional)"
                      className="w-full rounded-md border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Assessment Grade Entry ───────────────────────────────────────────────────
function AssessmentGradeEntry({
  assessment,
  enrolledStudents,
  existingScores,
  onSave,
  onBack,
  isSaving,
}: {
  assessment: RegistryRow;
  enrolledStudents: RegistryRow[];
  existingScores: RegistryRow[];
  onSave: (entries: Array<{ studentId: number; score: number; feedback: string }>) => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}) {
  const maxScore = Number(assessment.maxScore ?? 10);
  const [entries, setEntries] = useState<Record<number, GradeEntry>>(() => {
    const init: Record<number, GradeEntry> = {};
    for (const s of existingScores) {
      init[s.studentId as number] = { score: String(s.score ?? ""), feedback: String(s.feedback ?? "") };
    }
    return init;
  });

  const scoredCount = existingScores.length;
  const totalStudents = enrolledStudents.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = Object.entries(entries)
      .filter(([, v]) => v.score !== "" && !isNaN(parseFloat(v.score)))
      .map(([id, v]) => ({ studentId: Number(id), score: parseFloat(v.score), feedback: v.feedback }));
    await onSave(data);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{String(assessment.title)}</h3>
          <p className="text-xs text-muted-foreground">
            Nota máxima: {maxScore} · Avaliados: {scoredCount}/{totalStudents} alunos
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-[1fr_90px_1fr] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
              <span>Aluno</span>
              <span>Nota /{maxScore}</span>
              <span>Comentário / Feedback</span>
            </div>
            {enrolledStudents.map(student => {
              const id = student.id as number;
              const entry = entries[id] ?? { score: "", feedback: "" };
              const scoreNum = parseFloat(entry.score);
              const isOver = !isNaN(scoreNum) && scoreNum > maxScore;
              const normalized = !isNaN(scoreNum) && maxScore > 0 ? (scoreNum / maxScore) * 10 : NaN;

              return (
                <div key={String(id)} className="grid grid-cols-[1fr_90px_1fr] items-start gap-2 py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{String(student.name)}</span>
                    {!isNaN(normalized) && (
                      <span className={`text-xs font-bold ${gradeColor(normalized)}`}>→{normalized.toFixed(1)}</span>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={maxScore}
                    step={0.1}
                    value={entry.score}
                    onChange={e => setEntries(prev => ({ ...prev, [id]: { ...prev[id] ?? { score: "", feedback: "" }, score: e.target.value } }))}
                    className={`h-8 text-sm ${isOver ? "border-red-300 bg-red-50" : ""}`}
                    placeholder="—"
                  />
                  <Input
                    value={entry.feedback}
                    onChange={e => setEntries(prev => ({ ...prev, [id]: { ...prev[id] ?? { score: "", feedback: "" }, feedback: e.target.value } }))}
                    placeholder="Comentário individual..."
                    className="h-8 text-xs"
                  />
                </div>
              );
            })}
            <div className="pt-2">
              <Button type="submit" className="bg-red-brand hover:bg-red-700" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Notas"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeacherGrades() {
  const [tab, setTab] = useState<MainTab>("provas");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [gradeAssessmentId, setGradeAssessmentId] = useState<number | null>(null);
  const [gradeTaskId, setGradeTaskId] = useState<number | null>(null);

  const { data: teacherProfile } = trpc.profiles.teacher.me.useQuery();
  const { data: classes } = trpc.profiles.teacher.classes.useQuery();
  const classList = (classes ?? []) as RegistryRow[];

  const selectedClass = classList.find(c => c.id === selectedClassId);
  const classSubjectId = selectedClass?.classSubjectId as number | undefined;

  // Assessments (provas)
  const { data: assessments, refetch: refetchAssessments } = trpc.registry.list.useQuery(
    {
      entity: "assessments" as const,
      filters: teacherProfile && classSubjectId
        ? { teacherId: teacherProfile.id as number, classSubjectId }
        : {},
      limit: 100,
      orderBy: "assessmentDate",
      orderDirection: "desc",
    },
    { enabled: !!selectedClassId && !!teacherProfile && !!classSubjectId }
  );
  const assessmentList = (assessments ?? []) as RegistryRow[];

  // Tasks (tarefas)
  const { data: tasksData, refetch: refetchTasks } = trpc.tasks.forTeacher.useQuery(
    { classSubjectId: classSubjectId! },
    { enabled: !!classSubjectId }
  );
  const taskList = ((tasksData?.tasks ?? []) as RegistryRow[]).sort(
    (a, b) => String(b.dueDate ?? "").localeCompare(String(a.dueDate ?? ""))
  );
  const submissionList = (tasksData?.submissions ?? []) as RegistryRow[];

  // Students
  const { data: enrollments } = trpc.registry.list.useQuery(
    { entity: "classEnrollments" as const, filters: selectedClassId ? { classId: selectedClassId } : {}, limit: 200 },
    { enabled: !!selectedClassId }
  );
  const { data: studentRecords } = trpc.registry.list.useQuery({ entity: "students" as const, limit: 500 });
  const enrollmentList = (enrollments ?? []) as RegistryRow[];
  const studentList = (studentRecords ?? []) as RegistryRow[];
  const enrolledStudents = enrollmentList
    .map(e => studentList.find(s => s.id === e.studentId))
    .filter(Boolean) as RegistryRow[];

  // Scores for grade entry assessment
  const { data: existingScores, refetch: refetchScores } = trpc.grades.byAssessment.useQuery(
    { assessmentId: gradeAssessmentId! },
    { enabled: !!gradeAssessmentId }
  );
  const scoreList = (existingScores ?? []) as RegistryRow[];

  // Class summary
  const { data: classSummary } = trpc.grades.classSummary.useQuery(
    { classSubjectId: classSubjectId! },
    { enabled: tab === "resumo" && !!classSubjectId }
  );

  // Mutations
  const createAssessment = trpc.grades.assessmentCreate.useMutation({
    onSuccess: () => { refetchAssessments(); setShowCreateAssessment(false); toast.success("Avaliação criada!"); },
    onError: () => toast.error("Erro ao criar avaliação"),
  });
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => { refetchTasks(); setShowCreateTask(false); toast.success("Tarefa criada!"); },
    onError: () => toast.error("Erro ao criar tarefa"),
  });
  const closeTask = trpc.tasks.close.useMutation({ onSuccess: () => refetchTasks() });
  const reopenTask = trpc.tasks.reopen.useMutation({ onSuccess: () => refetchTasks() });
  const gradeSubmission = trpc.tasks.grade.useMutation({ onSuccess: () => refetchTasks() });
  const recordScore = trpc.grades.create.useMutation({ onSuccess: () => refetchScores() });

  function getClassName(cls: RegistryRow) {
    return String(cls.displayName || cls.gradeLabel || cls.name || `Turma ${cls.id}`);
  }

  const selectedTask = taskList.find(t => t.id === gradeTaskId);
  const taskSubmissions = selectedTask
    ? submissionList.filter(s => s.taskId === selectedTask.id)
    : [];

  const gradeAssessment = assessmentList.find(a => a.id === gradeAssessmentId);

  // ─── Assessment count helpers ────────────────────────────────────────────
  function getAssessmentCounts(assessmentId: number) {
    const now = new Date().toISOString().split("T")[0];
    const a = assessmentList.find(x => x.id === assessmentId);
    return {
      total: enrolledStudents.length,
      scored: 0, // Would need all scores — simplified
      isPast: a ? String(a.assessmentDate ?? "") < now : false,
    };
  }

  // ─── Task count helpers ────────────────────────────────────────────────
  function getTaskCounts(taskId: number) {
    const subs = submissionList.filter(s => s.taskId === taskId);
    const submitted = subs.filter(s => !!s.submittedAt).length;
    const graded = subs.filter(s => !!s.gradedAt).length;
    return { submitted, graded, total: enrolledStudents.length };
  }

  async function handleSaveScores(data: Array<{ studentId: number; score: number; feedback: string }>) {
    let saved = 0;
    for (const entry of data) {
      try {
        await recordScore.mutateAsync({ assessmentId: gradeAssessmentId!, studentId: entry.studentId, score: entry.score, feedback: entry.feedback || null });
        saved++;
      } catch { /* individual errors handled */ }
    }
    if (saved > 0) toast.success(`${saved} nota(s) salva(s)!`);
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Class selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Turma</label>
          <select
            value={selectedClassId ?? ""}
            onChange={e => {
              setSelectedClassId(Number(e.target.value) || null);
              setGradeAssessmentId(null);
              setGradeTaskId(null);
              setShowCreateAssessment(false);
              setShowCreateTask(false);
            }}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione a turma...</option>
            {classList.map(cls => (
              <option key={String(cls.id)} value={String(cls.id)}>
                {getClassName(cls)} · {String(cls.subject || "—")}
              </option>
            ))}
          </select>
        </div>

        {selectedClassId && (
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {([
              { id: "provas" as const, label: "Provas", count: assessmentList.length },
              { id: "tarefas" as const, label: "Tarefas", count: taskList.length },
              { id: "resumo" as const, label: "Resumo", count: null },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setGradeAssessmentId(null); setGradeTaskId(null); setShowCreateAssessment(false); setShowCreateTask(false); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">{t.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedClassId && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <ClipboardList className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Selecione uma turma para ver avaliações e tarefas</p>
          </CardContent>
        </Card>
      )}

      {/* ── PROVAS TAB ─────────────────────────────────────────────────────── */}
      {selectedClassId && tab === "provas" && !gradeAssessmentId && (
        <div className="space-y-4">
          {showCreateAssessment ? (
            <CreateAssessmentForm
              onSubmit={data => createAssessment.mutate({ classSubjectId: classSubjectId!, ...data })}
              onCancel={() => setShowCreateAssessment(false)}
              isPending={createAssessment.isPending}
            />
          ) : (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Provas e Avaliações</h3>
              <Button
                size="sm"
                className="bg-red-brand hover:bg-red-700"
                onClick={() => setShowCreateAssessment(true)}
              >
                <PlusCircle className="size-4 mr-1" /> Nova Prova
              </Button>
            </div>
          )}

          {!showCreateAssessment && assessmentList.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto size-8 opacity-30 mb-2" />
                <p className="text-sm">Nenhuma prova criada para esta turma</p>
              </CardContent>
            </Card>
          )}

          {!showCreateAssessment && assessmentList.map(a => {
            const now = new Date().toISOString().split("T")[0];
            const isPast = String(a.assessmentDate ?? "") <= now;
            return (
              <Card key={String(a.id)}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{String(a.title)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📅 {a.assessmentDate ? new Date(String(a.assessmentDate) + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                        {" · "}🎯 Máx: {String(a.maxScore)} pts
                        {" · "}⚖️ Peso: {String(a.weight ?? 1)}
                      </p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{String(a.description)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPast && (
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                          {enrolledStudents.length} alunos
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGradeAssessmentId(a.id as number)}
                      >
                        Lançar Notas
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── GRADE ENTRY (assessment) ───────────────────────────────────────── */}
      {selectedClassId && tab === "provas" && gradeAssessmentId && gradeAssessment && (
        <AssessmentGradeEntry
          assessment={gradeAssessment}
          enrolledStudents={enrolledStudents}
          existingScores={scoreList}
          onSave={handleSaveScores}
          onBack={() => setGradeAssessmentId(null)}
          isSaving={recordScore.isPending}
        />
      )}

      {/* ── TAREFAS TAB ───────────────────────────────────────────────────── */}
      {selectedClassId && tab === "tarefas" && !gradeTaskId && (
        <div className="space-y-4">
          {showCreateTask ? (
            <CreateTaskForm
              onSubmit={data => createTask.mutate({ classSubjectId: classSubjectId!, ...data })}
              onCancel={() => setShowCreateTask(false)}
              isPending={createTask.isPending}
            />
          ) : (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tarefas (Trabalhos e Atividades)</h3>
              <Button
                size="sm"
                className="bg-red-brand hover:bg-red-700"
                onClick={() => setShowCreateTask(true)}
              >
                <PlusCircle className="size-4 mr-1" /> Nova Tarefa
              </Button>
            </div>
          )}

          {!showCreateTask && taskList.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto size-8 opacity-30 mb-2" />
                <p className="text-sm">Nenhuma tarefa criada para esta turma</p>
              </CardContent>
            </Card>
          )}

          {!showCreateTask && taskList.map(task => {
            const { submitted, graded, total } = getTaskCounts(task.id as number);
            const now = new Date().toISOString().split("T")[0];
            const isLate = String(task.dueDate ?? "") < now;
            const isClosed = !!task.closedAt;
            const pending = total - submitted;
            const typeLabel = task.taskType === "atividade" ? "📝 Atividade" : "📁 Trabalho";

            return (
              <Card key={String(task.id)} className={isClosed ? "opacity-80" : ""}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{String(task.title)}</p>
                        <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground">{typeLabel}</span>
                        {isClosed && <span className="text-[10px] rounded-full px-2 py-0.5 bg-red-100 text-red-700"><Lock className="inline size-2.5 mr-0.5" />Fechada</span>}
                        {!isClosed && isLate && <span className="text-[10px] rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">⚠️ Prazo vencido</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Prazo: {task.dueDate ? new Date(String(task.dueDate) + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                        {" · "}Valor: {String(task.maxScore ?? 10)} pts
                      </p>
                      <div className="flex gap-4 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="size-3" />{submitted}/{total} responderam
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <TrendingUp className="size-3" />{graded} avaliados
                        </span>
                        {pending > 0 && !isClosed && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="size-3" />{pending} pendentes
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setGradeTaskId(task.id as number)}>
                      Ver Respostas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── TASK SUBMISSIONS VIEW ─────────────────────────────────────────── */}
      {selectedClassId && tab === "tarefas" && gradeTaskId && selectedTask && (
        <TaskSubmissionsPanel
          task={selectedTask}
          submissions={taskSubmissions}
          enrolledStudents={enrolledStudents}
          onBack={() => setGradeTaskId(null)}
          onGrade={async (subId, score, feedback) => {
            await gradeSubmission.mutateAsync({ submissionId: subId, score, feedback });
          }}
          onClose={() => closeTask.mutate({ taskId: gradeTaskId })}
          onReopen={() => reopenTask.mutate({ taskId: gradeTaskId })}
          isPendingClose={closeTask.isPending}
          isPendingReopen={reopenTask.isPending}
        />
      )}

      {/* ── RESUMO TAB ────────────────────────────────────────────────────── */}
      {selectedClassId && tab === "resumo" && (
        <div className="space-y-4">
          {classSummary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Avaliações", value: (classSummary as RegistryRow).assessmentCount ?? assessmentList.length, icon: BookOpen, color: "text-blue-600" },
                  { label: "Alunos", value: enrolledStudents.length, icon: Users, color: "text-foreground" },
                  { label: "Média da turma", value: `${String((classSummary as RegistryRow).classAverage ?? "—")}`, icon: TrendingUp, color: "text-green-600" },
                  { label: "Tarefas criadas", value: taskList.length, icon: FileText, color: "text-amber-600" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <Icon className={`size-4 ${color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {((classSummary as RegistryRow).assessments as RegistryRow[] | undefined)?.length && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Avaliações</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {((classSummary as RegistryRow).assessments as RegistryRow[]).map(a => (
                      <div key={String(a.id)} className="flex items-center justify-between border-b py-2 last:border-0">
                        <span className="text-sm">{String(a.title)}</span>
                        <span className="text-xs text-muted-foreground">Máx: {String(a.maxScore)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-sm">Distribuição de Notas</CardTitle></CardHeader>
                <CardContent>
                  {(["0-4", "4-6", "6-8", "8-10"] as const).map(range => {
                    const dist = (classSummary as RegistryRow).distribution as Record<string, number>;
                    const count = dist?.[range] ?? 0;
                    const max = Math.max(...Object.values(dist ?? {}), 1);
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={range} className="flex items-center gap-3 mb-2">
                        <span className="text-xs w-10 text-muted-foreground">{range}</span>
                        <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${range === "8-10" ? "bg-green-500" : range === "6-8" ? "bg-blue-500" : range === "4-6" ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs w-6 text-right font-medium">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <TrendingUp className="mx-auto size-8 opacity-30 mb-2" />
                <p className="text-sm">Carregando resumo...</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
