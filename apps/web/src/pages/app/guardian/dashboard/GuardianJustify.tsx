import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { CheckCircle, Clock, Upload, XCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import GuardianStudentCard from "../GuardianStudentCard";
import { useGuardianStudent } from "../useGuardianStudent";

export default function GuardianJustify() {
  const utils = trpc.useUtils();
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const { selectedStudentId, setSelectedStudentId } = useGuardianStudent();
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  const studentList = (students ?? []) as Array<{
    id: number;
    name: string | null;
    grade: string | null;
    enrollmentNumber: string | null;
    averageGrade: number;
  }>;

  // Auto-select first student
  useEffect(() => {
    if (studentList.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(studentList[0].id);
    }
  }, [studentList, selectedStudentId, setSelectedStudentId]);

  // Get absent attendance records for selected student
  const { data: records } = trpc.registry.list.useQuery(
    {
      entity: "attendanceRecords" as const,
      filters: { studentId: selectedStudentId!, status: "absent" },
      limit: 500,
    },
    { enabled: !!selectedStudentId }
  );
  const { data: sessions } = trpc.registry.list.useQuery(
    {
      entity: "classSessions" as const,
      limit: 500,
    },
    { enabled: !!selectedStudentId }
  );
  const { data: classSubjects } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: 100,
  });
  const { data: teachers } = trpc.registry.list.useQuery({
    entity: "teachers" as const,
    limit: 200,
  });

  const allRecords = (records ?? []) as RegistryRow[];
  const sessionList = (sessions ?? []) as RegistryRow[];
  const subjectList = (classSubjects ?? []) as RegistryRow[];
  const teacherList = (teachers ?? []) as RegistryRow[];

  // Get guardian's own justifications
  const { data: justifications } = trpc.justifications.listMine.useQuery();

  const justificationList = (justifications ?? []) as RegistryRow[];
  const justifiedRecordIds = new Set(
    justificationList.map(j => j.attendanceRecordId as number)
  );

  // Filter out already justified records (server already filters by studentId + absent)
  const absentRecords = allRecords
    .filter(r => !justifiedRecordIds.has(r.id as number))
    .map(r => {
      const session = sessionList.find(s => s.id === r.classSessionId);
      const subject = subjectList.find(s => s.id === session?.classSubjectId);
      const teacher = teacherList.find(t => t.id === session?.teacherId);
      return {
        ...r,
        subjectName: subject
          ? String(subject.subjectName || subject.name || "—")
          : "—",
        teacherName: teacher ? String(teacher.name) : null,
        sessionDate: session?.lessonDate ? String(session.lessonDate) : null,
      };
    });

  const justifyMutation = trpc.justifications.create.useMutation({
    onSuccess: () => {
      toast.success("Justificativa enviada com sucesso!");
      setReason("");
      setSelectedRecordId(null);
      setShowForm(false);
      void utils.justifications.listMine.invalidate();
      void utils.registry.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao enviar justificativa"),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedRecordId || !reason.trim() || reason.length < 10) return;

    justifyMutation.mutate({
      attendanceRecordId: selectedRecordId,
      reason: reason.trim(),
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Justificar Falta</h2>

      {/* Student selector */}
      <GuardianStudentCard
        students={studentList}
        selectedStudentId={selectedStudentId}
        onSelect={id => {
          setSelectedStudentId(id);
          setShowForm(false);
          setSelectedRecordId(null);
        }}
      />

      {/* Justify form (modal-like) */}
      {showForm && selectedRecordId && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="size-5 text-red-500" />
              Justificar esta falta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const record = absentRecords.find(r => r.id === selectedRecordId);
              return record ? (
                <div className="mb-4 rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">
                    {record.sessionDate
                      ? new Date(
                          record.sessionDate + "T12:00:00"
                        ).toLocaleDateString("pt-BR")
                      : "—"}{" "}
                    · {record.subjectName}
                  </p>
                  {record.teacherName && (
                    <p className="text-xs text-muted-foreground">
                      Prof. {record.teacherName}
                    </p>
                  )}
                </div>
              ) : null;
            })()}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Motivo</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  minLength={10}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="Descreva o motivo da falta (mínimo 10 caracteres)"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {reason.length}/10 mínimo
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Anexo (opcional)
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <Upload className="size-4" />
                  <span>Atestado ou documento (em breve)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={justifyMutation.isPending || reason.length < 10}
                >
                  {justifyMutation.isPending
                    ? "Enviando..."
                    : "Enviar Justificativa"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedRecordId(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Absent records list */}
      {selectedStudentId && !showForm && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">
            Faltas sem justificativa
          </h3>
          {absentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma falta pendente de justificativa
            </p>
          ) : (
            <div className="space-y-2">
              {absentRecords
                .sort((a, b) =>
                  (b.sessionDate || "").localeCompare(a.sessionDate || "")
                )
                .map(record => (
                  <div
                    key={String(record.id)}
                    className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-4 py-3 dark:border-red-900/30 dark:bg-red-950/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {record.sessionDate
                          ? new Date(
                              record.sessionDate + "T12:00:00"
                            ).toLocaleDateString("pt-BR")
                          : "—"}{" "}
                        · {record.subjectName}
                      </p>
                      {record.teacherName && (
                        <p className="text-xs text-muted-foreground">
                          Prof. {record.teacherName}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setSelectedRecordId(record.id as number);
                        setShowForm(true);
                      }}
                    >
                      Justificar
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Past justifications */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Minhas justificativas</h3>
        {justificationList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma justificativa enviada
          </p>
        ) : (
          <div className="space-y-2">
            {justificationList.map(j => {
              const status = String(j.status);
              return (
                <div
                  key={String(j.id)}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {String(j.reason).substring(0, 80)}
                      {String(j.reason).length > 80 ? "..." : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {j.createdAt
                        ? new Date(String(j.createdAt)).toLocaleDateString(
                            "pt-BR"
                          )
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status === "pending" && <Clock className="size-3" />}
                    {status === "approved" && (
                      <CheckCircle className="size-3" />
                    )}
                    {status === "rejected" && <XCircle className="size-3" />}
                    {status === "pending"
                      ? "Pendente"
                      : status === "approved"
                        ? "Aprovada"
                        : "Rejeitada"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
