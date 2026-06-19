import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const SHIFT_LABELS: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  full_day: "Integral",
};

function formatClassName(cls: RegistryRow): string {
  if (cls.displayName) return String(cls.displayName);

  const grade = String(cls.gradeLabel || "").trim();
  const course = String(cls.course || "").trim();
  const name = String(cls.name || "").trim();

  // Convert pure numeric grade to ordinal (1 → "1º Ano", 2 → "2º Ano", ...)
  const gradeNum = parseInt(grade, 10);
  const gradeStr =
    !isNaN(gradeNum) && gradeNum > 0 && String(gradeNum) === grade
      ? `${gradeNum}º Ano`
      : grade;

  if (gradeStr && course) return `${gradeStr} — ${course}`;
  if (gradeStr && name && gradeStr.toLowerCase() !== name.toLowerCase())
    return `${gradeStr} — ${name}`;
  if (gradeStr) return gradeStr;
  if (course) return name ? `${name} — ${course}` : course;
  return name || `Turma ${cls.id}`;
}

export default function SchoolClasses() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const { data: classes, refetch: refetchClasses } = trpc.registry.list.useQuery(
    {
      entity: "classes" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 200,
    },
    { enabled: !!schoolId }
  );
  const { data: schoolYears } = trpc.registry.list.useQuery(
    {
      entity: "schoolYears" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 10,
    },
    { enabled: !!schoolId }
  );
  const { data: enrollments, refetch: refetchEnrollments } = trpc.registry.list.useQuery(
    { entity: "classEnrollments" as const, limit: 1000 },
    { enabled: !!schoolId }
  );
  const { data: students } = trpc.registry.list.useQuery(
    {
      entity: "students" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 500,
    },
    { enabled: !!schoolId }
  );

  const [showForm, setShowForm] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", gradeLabel: "", shift: "morning" });
  const [showEnrollStudent, setShowEnrollStudent] = useState<number | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState<number | null>(null);

  const createClass = trpc.registry.create.useMutation();
  const createEnrollment = trpc.registry.create.useMutation();

  const classList = (classes ?? []) as RegistryRow[];
  const yearList = (schoolYears ?? []) as RegistryRow[];
  const enrollmentList = (enrollments ?? []) as RegistryRow[];
  const studentList = (students ?? []) as RegistryRow[];
  const currentYear = yearList.find(y => y.isCurrent === 1 || y.isActive === 1);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!schoolId) return;
    try {
      await createClass.mutateAsync({
        entity: "classes" as const,
        data: {
          schoolId,
          schoolYearId: (currentYear?.id as number) ?? undefined,
          name: form.name,
          gradeLabel: form.gradeLabel,
          shift: form.shift,
          status: "ativo",
        },
      });
      toast.success("Turma criada!");
      setShowForm(false);
      setForm({ name: "", gradeLabel: "", shift: "morning" });
      refetchClasses();
    } catch {
      toast.error("Erro ao criar turma");
    }
  }

  async function handleEnroll(classId: number) {
    if (!enrollStudentId) return;
    try {
      await createEnrollment.mutateAsync({
        entity: "classEnrollments" as const,
        data: {
          classId,
          studentId: enrollStudentId,
          enrolledAt: new Date().toISOString(),
        },
      });
      toast.success("Aluno matriculado!");
      setShowEnrollStudent(null);
      setEnrollStudentId(null);
      refetchEnrollments();
    } catch {
      toast.error("Erro ao matricular aluno");
    }
  }

  function getClassEnrollments(classId: number) {
    return enrollmentList.filter(e => e.classId === classId);
  }

  function getStudentName(studentId: number) {
    const s = studentList.find(st => st.id === studentId);
    return s ? String(s.name) : "—";
  }

  function getAvailableStudents(classId: number) {
    const enrolledHere = new Set(
      enrollmentList.filter(e => e.classId === classId).map(e => e.studentId as number)
    );
    return studentList.filter(s => !enrolledHere.has(s.id as number));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Turmas</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-red-brand hover:bg-red-700"
        >
          <Users className="mr-2 size-4" />
          Nova Turma
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Nova Turma</CardTitle>
              <button onClick={() => setShowForm(false)}>
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Série / Ano *
                </label>
                <Input
                  placeholder="Ex: 1º Ano, 2º Ano, 3EM..."
                  value={form.gradeLabel}
                  onChange={e => setForm(p => ({ ...p, gradeLabel: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Curso / Habilitação
                </label>
                <Input
                  placeholder="Ex: Administração, Informática..."
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Turno
                </label>
                <select
                  value={form.shift}
                  onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="morning">Manhã</option>
                  <option value="afternoon">Tarde</option>
                  <option value="evening">Noite</option>
                  <option value="full_day">Integral</option>
                </select>
              </div>
              {currentYear && (
                <p className="text-xs text-muted-foreground">
                  Ano letivo: {String(currentYear.year || currentYear.label || "ativo")}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={createClass.isPending}
                >
                  {createClass.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Class list */}
      <div className="space-y-2">
        {classList.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada</p>
        )}

        {classList.map(cls => {
          const isExpanded = expandedClassId === (cls.id as number);
          const classEnrollments = getClassEnrollments(cls.id as number);
          const available = getAvailableStudents(cls.id as number);

          return (
            <div key={String(cls.id)} className="rounded-lg border bg-card">
              {/* Class header */}
              <button
                onClick={() =>
                  setExpandedClassId(isExpanded ? null : (cls.id as number))
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium">{formatClassName(cls)}</p>
                  <p className="text-xs text-muted-foreground">
                    {SHIFT_LABELS[String(cls.shift)] || String(cls.shift)}
                    {" · "}
                    {classEnrollments.length} aluno
                    {classEnrollments.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      String(cls.status) === "ativo"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {String(cls.status) === "ativo" ? "Ativa" : String(cls.status)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded: only students */}
              {isExpanded && (
                <div className="border-t px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <GraduationCap className="size-4" />
                      Alunos matriculados ({classEnrollments.length})
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowEnrollStudent(
                          showEnrollStudent === (cls.id as number) ? null : (cls.id as number)
                        );
                        setEnrollStudentId(null);
                      }}
                    >
                      <UserPlus className="mr-1 size-3" />
                      Matricular
                    </Button>
                  </div>

                  {/* Enroll form */}
                  {showEnrollStudent === (cls.id as number) && (
                    <div className="mb-3 flex gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
                      <select
                        value={enrollStudentId ?? ""}
                        onChange={e =>
                          setEnrollStudentId(Number(e.target.value) || null)
                        }
                        className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
                      >
                        <option value="">Selecionar aluno...</option>
                        {available.length === 0 && (
                          <option disabled>Todos os alunos já matriculados</option>
                        )}
                        {available.map(s => (
                          <option key={String(s.id)} value={String(s.id)}>
                            {String(s.name)}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        className="bg-red-brand hover:bg-red-700"
                        disabled={!enrollStudentId || createEnrollment.isPending}
                        onClick={() => handleEnroll(cls.id as number)}
                      >
                        {createEnrollment.isPending ? "..." : "Matricular"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowEnrollStudent(null);
                          setEnrollStudentId(null);
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}

                  {/* Student list */}
                  {classEnrollments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum aluno matriculado
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {classEnrollments.map((enroll, i) => (
                        <div
                          key={String(enroll.id)}
                          className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-sm"
                        >
                          <span className="w-5 shrink-0 text-xs text-muted-foreground">
                            {i + 1}
                          </span>
                          <span>{getStudentName(enroll.studentId as number)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
