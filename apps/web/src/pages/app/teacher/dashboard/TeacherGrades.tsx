import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

type Tab = "grades" | "assessments" | "summary";

export default function TeacherGrades() {
  const [tab, setTab] = useState<Tab>("assessments");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [maxScore, setMaxScore] = useState(10);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [showNewAssessment, setShowNewAssessment] = useState(false);

  const { data: teacherProfile } = trpc.profiles.teacher.me.useQuery();
  const { data: classes } = trpc.profiles.teacher.classes.useQuery();
  const classList = (classes ?? []) as RegistryRow[];

  // Resolve classSubjectId from class list — no extra query needed
  const selectedClass = classList.find(c => c.id === selectedClassId);
  const classSubjectId = selectedClass?.classSubjectId as number | undefined;

  // Assessments for this teacher and class
  const { data: assessments } = trpc.registry.list.useQuery(
    {
      entity: "assessments" as const,
      filters:
        teacherProfile && classSubjectId
          ? { teacherId: teacherProfile.id as number, classSubjectId }
          : {},
      limit: 100,
    },
    { enabled: !!selectedClassId && !!teacherProfile && !!classSubjectId }
  );
  const assessmentList = (assessments ?? []) as RegistryRow[];

  // Students for selected class
  const { data: enrollments } = trpc.registry.list.useQuery(
    {
      entity: "classEnrollments" as const,
      filters: selectedClassId ? { classId: selectedClassId } : {},
      limit: 200,
    },
    { enabled: !!selectedClassId }
  );
  const { data: studentRecords } = trpc.registry.list.useQuery({
    entity: "students" as const,
    limit: 500,
  });
  const enrollmentList = (enrollments ?? []) as RegistryRow[];
  const studentList = (studentRecords ?? []) as RegistryRow[];
  const enrolledStudents = enrollmentList
    .map(e => studentList.find(s => s.id === e.studentId))
    .filter(Boolean) as RegistryRow[];

  // Selected assessment scores
  const { data: existingScores } = trpc.grades.byAssessment.useQuery(
    { assessmentId: selectedAssessmentId! },
    { enabled: !!selectedAssessmentId }
  );
  const existingScoreList = (existingScores ?? []) as RegistryRow[];

  // Class summary
  const { data: classSummary } = trpc.grades.classSummary.useQuery(
    { classSubjectId: classSubjectId! },
    { enabled: tab === "summary" && !!classSubjectId }
  );

  const createAssessment = trpc.grades.assessmentCreate.useMutation();
  const recordScore = trpc.grades.create.useMutation();

  const selectedAssessment = assessmentList.find(a => a.id === selectedAssessmentId);
  const assessmentMaxScore = selectedAssessment ? Number(selectedAssessment.maxScore) : maxScore;

  function getClassName(cls: RegistryRow) {
    return String(cls.displayName || cls.gradeLabel || cls.name || `Turma ${cls.id}`);
  }

  async function handleCreateAssessment(e: FormEvent) {
    e.preventDefault();
    if (!classSubjectId) {
      toast.error("Nenhuma disciplina vinculada a esta turma");
      return;
    }

    try {
      await createAssessment.mutateAsync({
        classSubjectId,
        title: assessmentTitle,
        maxScore,
        weight: 1,
        assessmentDate,
      });
      toast.success("Avaliação criada!");
      setShowNewAssessment(false);
      setAssessmentTitle("");
    } catch {
      toast.error("Erro ao criar avaliação");
    }
  }

  async function handleSaveScores(e: FormEvent) {
    e.preventDefault();
    if (!selectedAssessmentId) {
      toast.error("Selecione uma avaliação");
      return;
    }

    let saved = 0;
    let errors = 0;

    for (const [studentIdStr, scoreStr] of Object.entries(scores)) {
      const score = parseFloat(scoreStr);
      if (isNaN(score) || score < 0 || score > assessmentMaxScore) continue;

      try {
        await recordScore.mutateAsync({
          assessmentId: selectedAssessmentId,
          studentId: Number(studentIdStr),
          score,
        });
        saved++;
      } catch {
        errors++;
      }
    }

    if (saved > 0) toast.success(`${saved} nota(s) salva(s)!`);
    if (errors > 0) toast.error(`${errors} nota(s) com erro`);
    setScores({});
  }

  return (
    <div className="space-y-6">
      {/* Class selector + tabs */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Turma</label>
          <select
            value={selectedClassId ?? ""}
            onChange={e => {
              setSelectedClassId(Number(e.target.value) || null);
              setSelectedAssessmentId(null);
            }}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {classList.map(cls => (
              <option key={String(cls.id)} value={String(cls.id)}>
                {getClassName(cls)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { id: "assessments", label: "Avaliações" },
              { id: "grades", label: "Lançar Notas" },
              { id: "summary", label: "Resumo" },
            ] as const
          ).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowNewAssessment(true)}
          disabled={!selectedClassId}
          className="bg-red-brand hover:bg-red-700"
        >
          Nova Avaliação
        </Button>
      </div>

      {/* New assessment form */}
      {showNewAssessment && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAssessment} className="space-y-3">
              <Input
                placeholder="Título da avaliação"
                value={assessmentTitle}
                onChange={e => setAssessmentTitle(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Nota máxima
                  </label>
                  <Input
                    type="number"
                    value={maxScore}
                    onChange={e => setMaxScore(Number(e.target.value))}
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={assessmentDate}
                    onChange={e => setAssessmentDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={createAssessment.isPending}
                >
                  Criar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewAssessment(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assessments tab */}
      {tab === "assessments" && selectedClassId && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Avaliações — {selectedClass ? getClassName(selectedClass) : ""}
          </h3>
          {assessmentList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação criada
            </p>
          )}
          {assessmentList.map(a => (
            <div
              key={String(a.id)}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{String(a.title)}</p>
                <p className="text-xs text-muted-foreground">
                  Máx: {String(a.maxScore)} ·{" "}
                  {a.assessmentDate
                    ? new Date(String(a.assessmentDate)).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAssessmentId(a.id as number);
                  setTab("grades");
                }}
              >
                Lançar Notas
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Grades entry tab */}
      {tab === "grades" && selectedClassId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lançar Notas</CardTitle>
            <div>
              <select
                value={selectedAssessmentId ?? ""}
                onChange={e =>
                  setSelectedAssessmentId(Number(e.target.value) || null)
                }
                className="rounded-lg border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">Selecione avaliação...</option>
                {assessmentList.map(a => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {String(a.title)} (máx {String(a.maxScore)})
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedAssessmentId ? (
              <form onSubmit={handleSaveScores} className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_80px] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>Aluno</span>
                  <span>Nota</span>
                  <span>Máx</span>
                </div>
                {enrolledStudents.map(student => {
                  const existing = existingScoreList.find(
                    s => s.studentId === student.id
                  );
                  const currentScore =
                    scores[student.id as number] ??
                    (existing ? String(existing.score) : "");
                  const scoreNum = parseFloat(currentScore);
                  const isOverMax = !isNaN(scoreNum) && scoreNum > assessmentMaxScore;

                  return (
                    <div
                      key={String(student.id)}
                      className="grid grid-cols-[1fr_80px_80px] items-center gap-2 py-1.5"
                    >
                      <span className="text-sm text-foreground">
                        {String(student.name)}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={assessmentMaxScore}
                        step={0.1}
                        value={currentScore}
                        onChange={e =>
                          setScores(prev => ({
                            ...prev,
                            [student.id as number]: e.target.value,
                          }))
                        }
                        className={`h-8 text-sm ${
                          isOverMax
                            ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
                            : ""
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {assessmentMaxScore}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-3">
                  <Button
                    type="submit"
                    className="bg-red-brand hover:bg-red-700"
                    disabled={recordScore.isPending}
                  >
                    {recordScore.isPending ? "Salvando..." : "Salvar Notas"}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Selecione uma avaliação acima
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary tab */}
      {tab === "summary" && selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo — {selectedClass ? getClassName(selectedClass) : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {(classSummary as RegistryRow | null) ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Média da turma</p>
                    <p className="text-2xl font-bold">
                      {String((classSummary as RegistryRow)?.classAverage ?? "—")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Total de avaliações</p>
                    <p className="text-2xl font-bold">
                      {String((classSummary as RegistryRow)?.assessmentCount ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Alunos abaixo da média</p>
                    <p className="text-2xl font-bold text-red-500">
                      {String((classSummary as RegistryRow)?.belowAverageCount ?? 0)}
                    </p>
                  </div>
                </div>

                {(
                  ((classSummary as RegistryRow)?.students ?? []) as RegistryRow[]
                ).map(s => (
                  <div
                    key={String(s.studentId)}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <span className="text-sm font-medium">{String(s.studentName)}</span>
                    <span
                      className={`text-sm font-bold ${
                        Number(s.average) >= 7
                          ? "text-green-600"
                          : Number(s.average) >= 5
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {String(s.average)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Selecione uma turma para ver o resumo
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
