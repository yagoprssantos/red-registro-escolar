import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { ArrowLeft, CheckCircle2, History, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

type Tab = "new" | "history";

export default function TeacherAttendance() {
  const [tab, setTab] = useState<Tab>("new");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<number, "present" | "absent">
  >({});

  const { data: teacherProfile } = trpc.profiles.teacher.me.useQuery();
  const { data: classes } = trpc.profiles.teacher.classes.useQuery();
  const classList = (classes ?? []) as RegistryRow[];

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

  // History: past sessions
  const { data: pastSessions } = trpc.registry.list.useQuery(
    {
      entity: "classSessions" as const,
      filters:
        selectedClassSubjectId != null
          ? { classSubjectId: selectedClassSubjectId }
          : {},
      limit: 50,
      orderBy: "lessonDate",
      orderDirection: "desc",
    },
    { enabled: tab === "history" && !!selectedClassId }
  );

  const createRecord = trpc.registry.create.useMutation();
  const attendanceCreate = trpc.attendance.create.useMutation();

  const enrollmentList = (enrollments ?? []) as RegistryRow[];
  const studentList = (studentRecords ?? []) as RegistryRow[];

  const enrolledStudents = enrollmentList
    .map(e => {
      const student = studentList.find(s => s.id === e.studentId);
      return student ? { ...student, enrollmentId: e.id } : null;
    })
    .filter(Boolean) as RegistryRow[];

  function selectClass(cls: RegistryRow) {
    setSelectedClassId(cls.id as number);
    setSelectedClassSubjectId(cls.classSubjectId as number);
    setStep(2);
  }

  function toggleAttendance(studentId: number) {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  function getSelectedClassName() {
    const cls = classList.find(c => c.id === selectedClassId);
    return cls ? String(cls.displayName || cls.gradeLabel || cls.name || "") : "";
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!selectedClassId || !selectedClassSubjectId) return;

    const teacherId = teacherProfile?.id;
    if (!teacherId) {
      toast.error("Perfil de professor não encontrado");
      return;
    }

    try {
      // 1. Create class session
      const sessionResult = await createRecord.mutateAsync({
        entity: "classSessions" as const,
        data: {
          classSubjectId: selectedClassSubjectId,
          teacherId,
          lessonDate: sessionDate,
        },
      });
      const sessionId = (sessionResult as RegistryRow)?.id as number;

      // 2. Create attendance records for all enrolled students (absent by default)
      for (const student of enrolledStudents) {
        const studentId = student.id as number;
        const status = attendanceMap[studentId] ?? "absent";
        try {
          await attendanceCreate.mutateAsync({
            classSessionId: sessionId,
            studentId,
            status,
          });
        } catch (err) {
          console.warn(`Attendance record failed for student ${studentId}:`, err);
        }
      }

      toast.success("Chamada registrada com sucesso!");
      setStep(1);
      setAttendanceMap({});
      setSelectedClassId(null);
      setSelectedClassSubjectId(null);
    } catch (error) {
      toast.error("Erro ao registrar chamada");
      console.error(error);
    }
  }

  const presentCount = enrolledStudents.filter(
    s => (attendanceMap[s.id as number] ?? "absent") === "present"
  ).length;
  const absentCount = enrolledStudents.length - presentCount;

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
          Nova Chamada
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="mr-1 inline size-4" />
          Histórico
        </button>
      </div>

      {tab === "new" && (
        <>
          {/* Step 1: Select class */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Selecione a turma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {classList.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma turma encontrada
                  </p>
                )}
                {classList.map(cls => (
                  <button
                    key={String(cls.id)}
                    onClick={() => selectClass(cls)}
                    className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted min-h-[44px]"
                  >
                    <span className="text-sm font-medium">
                      {String(cls.displayName || cls.gradeLabel || cls.name || `Turma ${cls.id}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {String(
                        cls.shift === "morning"
                          ? "Manhã"
                          : cls.shift === "afternoon"
                            ? "Tarde"
                            : cls.shift === "evening"
                              ? "Noite"
                              : "Integral"
                      )}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Date + attendance list */}
          {step === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {getSelectedClassName()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Data da aula
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={e => setSessionDate(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Chamada — {sessionDate}</CardTitle>
                  <div className="flex gap-3 text-sm">
                    <span className="font-medium text-green-600">✓ {presentCount}</span>
                    <span className="font-medium text-red-500">✗ {absentCount}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {enrolledStudents.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum aluno matriculado nesta turma
                    </p>
                  )}
                  <form onSubmit={handleSave} className="space-y-2">
                    {enrolledStudents.map(student => {
                      const status = attendanceMap[student.id as number] ?? "absent";
                      return (
                        <button
                          key={String(student.id)}
                          type="button"
                          onClick={() => toggleAttendance(student.id as number)}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors min-h-[44px] ${
                            status === "present"
                              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                          }`}
                        >
                          <span className="text-sm font-medium text-foreground">
                            {String(student.name)}
                          </span>
                          {status === "present" ? (
                            <CheckCircle2 className="size-5 text-green-600" />
                          ) : (
                            <XCircle className="size-5 text-red-500" />
                          )}
                        </button>
                      );
                    })}
                    <div className="pt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setStep(1);
                          setAttendanceMap({});
                        }}
                      >
                        <ArrowLeft className="mr-1 size-4" />
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-red-brand hover:bg-red-700"
                        disabled={
                          attendanceCreate.isPending ||
                          createRecord.isPending ||
                          enrolledStudents.length === 0
                        }
                      >
                        {attendanceCreate.isPending || createRecord.isPending
                          ? "Salvando..."
                          : "Salvar Chamada"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {classList.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Filtrar por turma
              </label>
              <select
                value={selectedClassId ?? ""}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedClassId(id);
                  const cls = classList.find(c => c.id === id);
                  setSelectedClassSubjectId(cls ? (cls.classSubjectId as number) : null);
                }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas as turmas</option>
                {classList.map(cls => (
                  <option key={String(cls.id)} value={String(cls.id)}>
                    {String(cls.displayName || cls.gradeLabel || cls.name)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(pastSessions ?? []).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma chamada registrada ainda
                </p>
              </CardContent>
            </Card>
          )}

          {((pastSessions ?? []) as RegistryRow[]).map(session => (
            <Card key={String(session.id)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {session.lessonDate
                        ? new Date(String(session.lessonDate)).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSelectedClassName() || "Turma não selecionada"}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {String(session.status || "concluída")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
