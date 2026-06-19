import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  MAX_REGISTRY_LIMIT,
  type Student,
  type ClassSession,
  type ClassSubject,
  type Teacher,
  type AttendanceRecord,
  type StudentPerformance,
} from "@/lib/registry-types";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

type AttendanceEnrichedRow = {
  id: number;
  status: "present" | "absent" | "justified";
  justificationId?: number | null;
  sessionDate: string | null;
  subjectName: string;
  teacherName: string | null;
};

export default function GuardianAttendance() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const studentList = (students ?? []) as Student[];

  const { data: performance } =
    trpc.profiles.guardian.studentPerformance.useQuery(
      { studentId: selectedStudentId! },
      { enabled: !!selectedStudentId }
    );
  const perf = performance as StudentPerformance | null;

  // Get attendance records for selected student (filtered server-side)
  const { data: records } = trpc.registry.list.useQuery(
    {
      entity: "attendanceRecords" as const,
      filters: selectedStudentId ? { studentId: selectedStudentId } : {},
      limit: MAX_REGISTRY_LIMIT,
    },
    { enabled: !!selectedStudentId }
  );
  const { data: sessions } = trpc.registry.list.useQuery({
    entity: "classSessions" as const,
    limit: MAX_REGISTRY_LIMIT,
  });
  const { data: classSubjects } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: Math.min(100, MAX_REGISTRY_LIMIT),
  });
  const { data: teachers } = trpc.registry.list.useQuery({
    entity: "teachers" as const,
    limit: Math.min(200, MAX_REGISTRY_LIMIT),
  });

  const allRecords = (records ?? []) as unknown as AttendanceRecord[];
  const sessionList = (sessions ?? []) as unknown as ClassSession[];
  const subjectList = (classSubjects ?? []) as unknown as ClassSubject[];
  const teacherList = (teachers ?? []) as unknown as Teacher[];

  const studentRecords = allRecords;

  // Enrich with session, subject, and teacher info
  const enriched: AttendanceEnrichedRow[] = studentRecords.map(r => {
    const session = sessionList.find(s => s.id === r.classSessionId);
    const subject = subjectList.find(s => s.id === session?.classSubjectId);
    const teacher = teacherList.find(t => t.id === session?.teacherId);
    return {
      id: r.id,
      status: r.status,
      justificationId: r.justificationId ?? null,
      subjectName: subject
        ? subject.subjectName || subject.name || "—"
        : "—",
      teacherName: teacher?.name ?? null,
      sessionDate: session?.lessonDate ?? null,
    };
  });

  // Calculate stats
  const total = enriched.length;
  const presentCount = enriched.filter(r => r.status === "present").length;
  const justifiedCount = enriched.filter(r => r.status === "justified").length;
  const absentCount = enriched.filter(r => r.status === "absent").length;
  const attendancePct =
    total > 0
      ? Math.round(((presentCount + justifiedCount) / total) * 100)
      : null;

  // Class average (placeholder from performance data)
  const classAvg =
    perf?.classAverage != null ? String(perf.classAverage) : null;

  return (
    <div className="space-y-6">
      {/* Student selector */}
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
        Diferença vs aluno: inclui nome do professor e botão Justificar
      </p>

      {!selectedStudentId && (
        <p className="text-sm text-muted-foreground">
          Selecione um aluno para ver a frequência
        </p>
      )}

      {selectedStudentId && (
        <>
          {/* Alert banner */}
          {attendancePct != null && attendancePct < 75 && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm font-semibold text-red-600">
                ⚠️ Frequência ({attendancePct}%) abaixo do limite mínimo
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Faltas</span>
                  <span className="text-lg font-bold text-red-500">
                    {absentCount}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    % Presença
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      attendancePct != null && attendancePct >= 75
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {attendancePct ?? "—"}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Média turma
                  </span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {classAvg ?? "—"}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Justificadas
                  </span>
                  <span className="text-lg font-bold text-amber-500">
                    {justifiedCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance table */}
          {enriched.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum registro de frequência
            </p>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
              <span>Data</span>
              <span>Disciplina</span>
              <span>Professor</span>
              <span>Status</span>
            </div>

            {enriched
              .sort((a, b) =>
                (b.sessionDate || "").localeCompare(a.sessionDate || "")
              )
              .map(record => {
                const status = record.status as string;
                const isAbsent = status === "absent";
                return (
                  <div
                    key={String(record.id)}
                    className={`grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 rounded-lg border bg-card px-4 py-3 ${
                      isAbsent ? "border-red-100 dark:border-red-900/30" : ""
                    }`}
                  >
                    <span className="text-sm text-foreground">
                      {record.sessionDate
                        ? new Date(
                            record.sessionDate + "T12:00:00"
                          ).toLocaleDateString("pt-BR")
                        : "—"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {record.subjectName}
                    </span>
                    <span className="text-sm text-foreground">
                      {record.teacherName ? `Prof. ${record.teacherName}` : "—"}
                    </span>
                    <div className="flex items-center gap-2">
                      {status === "present" && (
                        <CheckCircle2 className="size-4 text-green-600" />
                      )}
                      {status === "absent" && (
                        <XCircle className="size-4 text-red-500" />
                      )}
                      {status === "justified" && (
                        <AlertTriangle className="size-4 text-amber-500" />
                      )}
                      {/* Justify button for absences not yet justified */}
                      {isAbsent && !record.justificationId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            // Navigate to justifications section - handled by parent
                            window.location.hash =
                              "justify-" + String(record.id);
                          }}
                        >
                          Justificar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
