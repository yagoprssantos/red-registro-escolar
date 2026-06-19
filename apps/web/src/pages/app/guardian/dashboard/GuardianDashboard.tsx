import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  type Student,
  type Notification,
  type StudentPerformance,
  type AssessmentScore,
  type SchoolEvent,
  type AbsenceJustification,
  MAX_REGISTRY_LIMIT,
} from "@/lib/registry-types";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ProfileSwitcher } from "../../login/ProfileSwitcher";

// ── Attendance ring ────────────────────────────────────────────────────────
function AttendanceRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="72" height="72" className="shrink-0">
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-muted/30"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={color}
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function GuardianDashboard() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const { data: notifications } = trpc.registry.notifications.mine.useQuery({
    unreadOnly: true,
    limit: Math.min(20, MAX_REGISTRY_LIMIT),
  });

  const studentList = (students ?? []) as Student[];
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  // Auto-select first student once loaded
  useEffect(() => {
    if (studentList.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(studentList[0].id);
    }
  }, [studentList, selectedStudentId]);

  const selectedStudent =
    studentList.find(s => s.id === selectedStudentId) ?? null;

  const alertNotifs = ((notifications ?? []) as unknown as Notification[]).filter(
    n => n.notificationType === "absence_alert"
  );

  // ── Performance for selected student ─────────────────────────────────────
  const { data: performance } =
    trpc.profiles.guardian.studentPerformance.useQuery(
      { studentId: selectedStudentId! },
      { enabled: !!selectedStudentId }
    );
  const perf = performance as StudentPerformance | null;

  // ── Last grades ───────────────────────────────────────────────────────────
  const { data: gradeData } = trpc.registry.list.useQuery(
    {
      entity: "assessmentScores" as const,
      filters: { studentId: selectedStudentId! },
      limit: Math.min(5, MAX_REGISTRY_LIMIT),
      orderBy: "createdAt",
      orderDirection: "desc",
    },
    { enabled: !!selectedStudentId }
  );
  const lastGrades = (gradeData ?? []) as unknown as AssessmentScore[];

  // ── Upcoming events ───────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const { data: eventData } = trpc.registry.list.useQuery(
    {
      entity: "schoolEvents" as const,
      filters: { dateFrom: today },
      limit: Math.min(3, MAX_REGISTRY_LIMIT),
      orderBy: "eventDate",
      orderDirection: "asc",
    },
    { enabled: !!selectedStudentId }
  );
  const upcomingEvents = (eventData ?? []) as unknown as SchoolEvent[];

  // ── Pending justifications ────────────────────────────────────────────────
  const { data: justifications } = trpc.registry.list.useQuery({
    entity: "absenceJustifications" as const,
    filters: { status: "pending" },
    limit: Math.min(50, MAX_REGISTRY_LIMIT),
  });
  const pendingJustifications = ((justifications ?? []) as unknown as AbsenceJustification[])
    .length;

  // ── Derived values ────────────────────────────────────────────────────────
  const attendancePct = perf
    ? Math.round(perf.attendanceRate ?? perf.presenceRate ?? perf.presencePct ?? 0)
    : null;

  const totalAbsences = perf
    ? perf.absenceCount ?? perf.totalAbsences ?? 0
    : null;

  const gpa = perf ? (perf.average ?? perf.gpa ?? 0).toFixed(1) : null;

  const gradeColor = (g: number) =>
    g >= 7 ? "text-green-600" : g >= 5 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* ── Student selector ────────────────────────────────────────────────── */}
      {studentList.length > 1 && (
        <ProfileSwitcher
          selectedId={selectedStudentId}
          onSelect={setSelectedStudentId}
          type="guardian"
        />
      )}

      {/* ── Absence alert ───────────────────────────────────────────────────── */}
      {alertNotifs.length > 0 && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-semibold">
              Alerta de falta registrada
            </span>
          </div>
          {alertNotifs.slice(0, 3).map(n => (
            <p
              key={String(n.id)}
              className="mt-1 text-sm text-red-700 dark:text-red-400"
            >
              {String(n.body ?? "")}
            </p>
          ))}
        </div>
      )}

      {/* ── Student identity card ────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted">
            {selectedStudent.avatarUrl ? (
              <img
                src={selectedStudent.avatarUrl}
                alt={selectedStudent.name ?? "—"}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <UserCircle2 className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {selectedStudent.name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Matrícula:{" "}
              {selectedStudent.enrollmentNumber ?? "—"}
            </p>
            {selectedStudent.className && (
              <p className="text-xs text-muted-foreground">
                Turma: {selectedStudent.className}
              </p>
            )}
          </div>
          {studentList.length > 1 && (
            <button
              onClick={() => {
                const idx = studentList.findIndex(
                  s => s.id === selectedStudentId
                );
                const next = studentList[(idx + 1) % studentList.length];
                setSelectedStudentId(next.id);
              }}
              className="ml-auto shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Trocar
            </button>
          )}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Frequência do mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Frequência no mês
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            {attendancePct !== null ? (
              <>
                <AttendanceRing pct={attendancePct} />
                <div>
                  <p
                    className={`text-xs font-medium ${
                      attendancePct >= 75
                        ? "text-green-600"
                        : attendancePct >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {attendancePct >= 75
                      ? "Regular"
                      : attendancePct >= 60
                        ? "Atenção"
                        : "Crítica"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalAbsences} falta(s)
                  </p>
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold">—</div>
            )}
          </CardContent>
        </Card>

        {/* Faltas no total */}
        <Card
          className={
            (totalAbsences ?? 0) > 0 ? "border-red-200 dark:border-red-800" : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Faltas</CardTitle>
            <AlertTriangle
              className={
                (totalAbsences ?? 0) > 0
                  ? "size-4 text-red-500"
                  : "size-4 text-muted-foreground"
              }
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (totalAbsences ?? 0) > 0 ? "text-red-600" : ""
              }`}
            >
              {totalAbsences ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">faltas no período</p>
          </CardContent>
        </Card>

        {/* Média geral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Média geral</CardTitle>
            <BookOpenCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                gpa !== null ? gradeColor(Number(gpa)) : ""
              }`}
            >
              {gpa ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">todas as matérias</p>
          </CardContent>
        </Card>

        {/* Justificativas pendentes */}
        <Card
          className={
            pendingJustifications > 0
              ? "border-amber-300 dark:border-amber-700"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Justificativas
            </CardTitle>
            <ShieldCheck
              className={
                pendingJustifications > 0
                  ? "size-4 text-amber-500"
                  : "size-4 text-muted-foreground"
              }
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pendingJustifications > 0 ? "text-amber-600" : ""
              }`}
            >
              {pendingJustifications}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingJustifications > 0
                ? "pendentes de análise"
                : "Nenhuma pendente"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Two-column: Últimas notas + Próximos eventos ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimas notas */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpenCheck className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Últimas notas
            </h3>
          </div>

          {!selectedStudentId ? (
            <p className="text-sm text-muted-foreground">
              Selecione um estudante para ver as notas
            </p>
          ) : lastGrades.length === 0 ? (
            <div className="rounded-lg border bg-card px-4 py-6 text-center">
              <ClipboardList className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma nota lançada ainda
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lastGrades.map(g => {
                const score = g.score ?? 0;
                const max = 10;
                const pct = max > 0 ? Math.round((score / max) * 100) : 0;
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {g.assessmentTitle ?? g.subjectName ?? "Avaliação"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {g.subjectName ?? ""}
                        {g.createdAt
                          ? ` · ${new Date(g.createdAt).toLocaleDateString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <span
                        className={`text-base font-bold ${gradeColor(score)}`}
                      >
                        {score}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{max}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          pct >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : pct >= 50
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Próximos eventos */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Próximos eventos
            </h3>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-lg border bg-card px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum evento nos próximos dias
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(ev => {
                const evDate = ev.eventDate
                  ? new Date(ev.eventDate)
                  : ev.startsAt
                    ? new Date(ev.startsAt)
                    : null;
                const day = evDate?.getDate();
                const month = evDate?.toLocaleDateString("pt-BR", {
                  month: "short",
                });
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    {evDate && (
                      <div className="flex w-10 shrink-0 flex-col items-center rounded-md border bg-muted/50 py-1">
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {month}
                        </span>
                        <span className="text-base font-bold leading-none text-foreground">
                          {day}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {ev.title ?? ev.name ?? "Evento"}
                      </p>
                      {ev.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {ev.description.substring(0, 60)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Meus dependentes ────────────────────────────────────────────────── */}
      {studentList.length > 1 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Meus dependentes
          </h3>
          <div className="space-y-2">
            {studentList.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted ${
                  selectedStudentId === s.id
                    ? "border-primary/30 bg-primary/5"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {s.avatarUrl ? (
                      <img
                        src={s.avatarUrl}
                        alt={s.name ?? ""}
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle2 className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matrícula: {s.enrollmentNumber ?? "—"}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedStudentId === s.id ? "●" : "○"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
