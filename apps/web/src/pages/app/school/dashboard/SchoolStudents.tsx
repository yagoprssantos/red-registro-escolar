import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ChevronRight, GraduationCap, Search, UserPlus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function SchoolStudents() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    grade: "",
    enrollmentCode: "",
  });
  const [newGuardian, setNewGuardian] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "pai",
  });
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const { data: students } = trpc.registry.list.useQuery(
    {
      entity: "students" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 500,
    },
    { enabled: !!schoolId }
  );
  const { data: classes } = trpc.registry.list.useQuery(
    {
      entity: "classes" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 200,
    },
    { enabled: !!schoolId }
  );
  const { data: enrollments } = trpc.registry.list.useQuery({
    entity: "classEnrollments" as const,
    limit: 500,
  });

  const studentList = (students ?? []) as RegistryRow[];
  const classList = (classes ?? []) as RegistryRow[];
  const enrollmentList = (enrollments ?? []) as RegistryRow[];

  const filtered = studentList.filter(
    s =>
      String(s.name).toLowerCase().includes(search.toLowerCase()) ||
      String(s.email || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(s.enrollmentCode || s.enrollmentNumber || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const createStudent = trpc.registry.create.useMutation();
  const createEnrollment = trpc.registry.create.useMutation();

  function getStudentClass(studentId: number) {
    const enroll = enrollmentList.find(e => e.studentId === studentId);
    if (!enroll) return null;
    const cls = classList.find(c => c.id === enroll.classId);
    return cls ? String(cls.name) : null;
  }

  async function handleStudentSubmit(e: FormEvent) {
    e.preventDefault();
    if (!schoolId) return;

    try {
      const enrollmentCode =
        newStudent.enrollmentCode.trim() ||
        `${new Date().getFullYear()}-${String(studentList.length + 1).padStart(4, "0")}`;

      const result = await createStudent.mutateAsync({
        entity: "students" as const,
        data: {
          schoolId,
          name: newStudent.name.trim(),
          email: newStudent.email.trim() || null,
          phone: newStudent.phone.trim() || null,
          dateOfBirth: newStudent.dateOfBirth || null,
          grade: newStudent.grade.trim() || null,
          enrollmentCode,
          enrollmentNumber: enrollmentCode,
          status: "ativo",
        },
      });

      // Auto-enroll in class if selected
      if (selectedClassId && result) {
        await createEnrollment.mutateAsync({
          entity: "classEnrollments" as const,
          data: {
            classId: selectedClassId,
            studentId: (result as RegistryRow).id as number,
            enrolledAt: new Date().toISOString(),
          },
        });
      }

      toast.success(`Aluno criado! Matrícula: ${enrollmentCode}`);
      setShowAdd(false);
      setStep(1);
      setNewStudent({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        grade: "",
        enrollmentCode: "",
      });
      setNewGuardian({ name: "", email: "", phone: "", relationship: "pai" });
      setSelectedClassId(null);
    } catch {
      toast.error("Erro ao criar aluno");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alunos</h2>
        <Button
          onClick={() => {
            setShowAdd(true);
            setStep(1);
          }}
          className="bg-red-brand hover:bg-red-700"
        >
          <UserPlus className="mr-2 size-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou matrícula..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Add student wizard */}
      {showAdd && (
        <Card className="border-red-brand/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Novo Aluno — Passo {step} de 3
              </CardTitle>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setStep(1);
                }}
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            {/* Progress indicator */}
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    s <= step ? "bg-red-brand" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nome completo *
                  </label>
                  <Input
                    value={newStudent.name}
                    onChange={e =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                    required
                    placeholder="Nome do aluno"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Data de nascimento
                  </label>
                  <Input
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={e =>
                      setNewStudent({
                        ...newStudent,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newStudent.email}
                    onChange={e =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    value={newStudent.phone}
                    onChange={e =>
                      setNewStudent({ ...newStudent, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Matrícula (auto se vazio)
                  </label>
                  <Input
                    value={newStudent.enrollmentCode}
                    onChange={e =>
                      setNewStudent({
                        ...newStudent,
                        enrollmentCode: e.target.value,
                      })
                    }
                    placeholder="Gerada automaticamente"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={!newStudent.name.trim()}
                >
                  Próximo: Turma <ChevronRight className="ml-1 size-4" />
                </Button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Série/Ano
                  </label>
                  <Input
                    value={newStudent.grade}
                    onChange={e =>
                      setNewStudent({ ...newStudent, grade: e.target.value })
                    }
                    placeholder="Ex: 6º Ano"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Vincular à turma
                  </label>
                  <select
                    value={selectedClassId ?? ""}
                    onChange={e =>
                      setSelectedClassId(Number(e.target.value) || null)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Nenhuma turma (pode vincular depois)
                    </option>
                    {classList.map(cls => (
                      <option key={String(cls.id)} value={String(cls.id)}>
                        {String(cls.name)} — {String(cls.gradeLabel || "")} ·{" "}
                        {String(
                          cls.shift === "morning"
                            ? "Manhã"
                            : cls.shift === "afternoon"
                              ? "Tarde"
                              : cls.shift === "evening"
                                ? "Noite"
                                : "Integral"
                        )}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">{newStudent.name}</p>
                  {newStudent.enrollmentCode && (
                    <p className="text-xs text-muted-foreground">
                      Matrícula: {newStudent.enrollmentCode}
                    </p>
                  )}
                  {selectedClassId && (
                    <p className="text-xs text-muted-foreground">
                      Turma:{" "}
                      {String(
                        classList.find(c => c.id === selectedClassId)?.name ??
                          ""
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Voltar
                  </Button>
                  <Button
                    className="bg-red-brand hover:bg-red-700"
                    onClick={() => setStep(3)}
                  >
                    Próximo: Responsável{" "}
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <h4 className="text-sm font-medium">Dados do Responsável</h4>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nome do responsável *
                  </label>
                  <Input
                    value={newGuardian.name}
                    onChange={e =>
                      setNewGuardian({ ...newGuardian, name: e.target.value })
                    }
                    required
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newGuardian.email}
                    onChange={e =>
                      setNewGuardian({ ...newGuardian, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    value={newGuardian.phone}
                    onChange={e =>
                      setNewGuardian({ ...newGuardian, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Parentesco
                  </label>
                  <select
                    value={newGuardian.relationship}
                    onChange={e =>
                      setNewGuardian({
                        ...newGuardian,
                        relationship: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="pai">Pai</option>
                    <option value="mae">Mãe</option>
                    <option value="tutor">Tutor</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Summary */}
                <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                  <p className="font-medium">{newStudent.name}</p>
                  {newStudent.enrollmentCode && (
                    <p className="text-xs text-muted-foreground">
                      Matrícula: {newStudent.enrollmentCode}
                    </p>
                  )}
                  {newStudent.grade && (
                    <p className="text-xs text-muted-foreground">
                      Série: {newStudent.grade}
                    </p>
                  )}
                  {selectedClassId && (
                    <p className="text-xs text-muted-foreground">
                      Turma:{" "}
                      {String(
                        classList.find(c => c.id === selectedClassId)?.name ??
                          ""
                      )}
                    </p>
                  )}
                  {newGuardian.name && (
                    <p className="text-xs text-muted-foreground">
                      Responsável: {newGuardian.name} (
                      {newGuardian.relationship})
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Credenciais de acesso serão geradas automaticamente após a
                  criação.
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    ← Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-brand hover:bg-red-700"
                    disabled={
                      createStudent.isPending ||
                      !newStudent.name.trim() ||
                      !newGuardian.name.trim()
                    }
                  >
                    {createStudent.isPending
                      ? "Criando..."
                      : "Concluir Cadastro"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum aluno encontrado
          </p>
        )}
        {filtered.map(student => {
          const className = getStudentClass(student.id as number);
          const status = String(student.status);
          return (
            <div
              key={String(student.id)}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-red-brand/10">
                  <GraduationCap className="size-4 text-red-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium">{String(student.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    Matrícula:{" "}
                    {String(
                      student.enrollmentCode || student.enrollmentNumber || "—"
                    )}
                    {student.email ? ` · ${String(student.email)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    status === "ativo"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : status === "transferido"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {status === "ativo"
                    ? "Ativo"
                    : status === "transferido"
                      ? "Transferido"
                      : status}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {className ?? "Sem turma"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
