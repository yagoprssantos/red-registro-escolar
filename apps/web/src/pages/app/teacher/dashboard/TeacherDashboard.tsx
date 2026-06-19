import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import {
  AlertTriangle,
  Bell,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  TrendingDown,
  Users,
} from "lucide-react";

const renderSafe = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
};

export default function TeacherDashboard() {
  const { data: teacherProfile } = trpc.profiles.teacher.me.useQuery();
  const { data: classes } = trpc.profiles.teacher.classes.useQuery();
  const { data: notifications } = trpc.registry.notifications.mine.useQuery({
    unreadOnly: true,
    limit: 10,
  });
  const { data: myComments } = trpc.comments.byTeacher.useQuery(
    { teacherId: teacherProfile?.id ?? 0 },
    { enabled: !!teacherProfile }
  );
  const { data: assessments } = trpc.registry.list.useQuery(
    {
      entity: "assessments" as const,
      limit: 10,
      orderBy: "assessmentDate",
      orderDirection: "desc",
    },
    { enabled: !!teacherProfile }
  );

  const classList = (classes ?? []) as RegistryRow[];
  const commentList = (myComments ?? []) as RegistryRow[];
  const notifList = (notifications ?? []) as RegistryRow[];
  const assessmentList = (assessments ?? []) as RegistryRow[];

  // ── Today's sessions ──────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const { data: todaySessions } = trpc.registry.list.useQuery(
    {
      entity: "classSessions" as const,
      filters: { lessonDate: today },
      limit: 200,
    },
    { enabled: classList.length > 0 }
  );
  const sessionList = (todaySessions ?? []) as RegistryRow[];
  const classesWithSessionToday = new Set(
    sessionList.map(s => s.classSubjectId as number)
  );
  const pendingAttendance = classList.filter(
    cls => !classesWithSessionToday.has(cls.id as number)
  );

  // ── Classes with most absences (recent 30 days) ───────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const { data: recentAbsences } = trpc.registry.list.useQuery(
    {
      entity: "attendanceRecords" as const,
      filters: { present: false, dateFrom: thirtyDaysAgo },
      limit: 500,
    },
    { enabled: classList.length > 0 }
  );
  const absenceList = (recentAbsences ?? []) as RegistryRow[];

  // Count absences per classSubjectId and map to class name
  const absencesByClass = absenceList.reduce<Record<number, number>>(
    (acc, a) => {
      const id = a.classSubjectId as number;
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const topAbsenteeClasses = classList
    .map(cls => ({
      id: cls.id as number,
      name: String(cls.name || cls.gradeLabel || "Turma"),
      absences: absencesByClass[cls.id as number] ?? 0,
    }))
    .filter(c => c.absences > 0)
    .sort((a, b) => b.absences - a.absences)
    .slice(0, 3);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const shiftLabel = (shift: unknown) =>
    shift === "morning"
      ? "Manhã"
      : shift === "afternoon"
        ? "Tarde"
        : shift === "evening"
          ? "Noite"
          : "Integral";

  const categoryIcon = (cat: string) =>
    cat === "elogio"
      ? "⭐"
      : cat === "melhoria"
        ? "🔄"
        : cat === "ocorrencia"
          ? "⚠️"
          : "💬";

  return (
    <div className="space-y-6">
      {/* ── Top stat cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total turmas */}
        <Card
          className="cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard:navigate", { detail: "attendance" }))}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Minhas turmas</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classList.length}</div>
            <p className="text-xs text-muted-foreground">turmas vinculadas</p>
          </CardContent>
        </Card>

        {/* Chamadas pendentes
        <Card
          className={
            pendingAttendance.length > 0
              ? "border-amber-300 dark:border-amber-700"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Chamadas pendentes
            </CardTitle>
            {pendingAttendance.length > 0 ? (
              <ClipboardList className="size-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="size-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pendingAttendance.length > 0
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
            >
              {pendingAttendance.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingAttendance.length > 0
                ? "turma(s) sem chamada hoje"
                : "Todas as chamadas registradas"}
            </p>
          </CardContent>
        </Card> */}

        {/* Últimas notas */}
        <Card
          className="cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard:navigate", { detail: "grades" }))}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Avaliações lançadas
            </CardTitle>
            <BookOpenCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentList.length}</div>
            <p className="text-xs text-muted-foreground">
              últimas 10 avaliações
            </p>
          </CardContent>
        </Card>

        {/* Comunicados não lidos */}
        <Card
          className={`cursor-pointer hover:bg-muted/30 transition-colors ${
            notifList.length > 0 ? "border-amber-300 dark:border-amber-700" : ""
          }`}
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard:navigate", { detail: "communications" }))}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Comunicados não lidos
            </CardTitle>
            <Bell
              className={
                notifList.length > 0
                  ? "size-4 text-amber-500"
                  : "size-4 text-muted-foreground"
              }
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                notifList.length > 0 ? "text-amber-600" : ""
              }`}
            >
              {notifList.length}
            </div>
            <p className="text-xs text-muted-foreground">avisos pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick actions ───────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard:navigate", { detail: "attendance" }))}
          className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted cursor-pointer"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Fazer chamada</p>
            <p className="text-xs text-muted-foreground">
              {pendingAttendance.length > 0
                ? `${pendingAttendance.length} turma(s) pendente(s)`
                : "Nenhuma pendência hoje"}
            </p>
          </div>
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard:navigate", { detail: "grades" }))}
          className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted cursor-pointer"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950">
            <BookOpenCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Avaliações e Notas</p>
            <p className="text-xs text-muted-foreground">
              {assessmentList.length} avaliação(ões) recentes
            </p>
          </div>
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard:navigate", { detail: "comments" }))}
          className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted cursor-pointer"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Novo comentário</p>
            <p className="text-xs text-muted-foreground">
              {commentList.length} comentário(s) feitos
            </p>
          </div>
        </button>
      </div>

      {/* ── Two-column section: Próximas aulas + Turmas com mais faltas ──── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas aulas do dia */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Aulas de hoje
            </h3>
            <Badge variant="secondary" className="ml-auto">
              {today.split("-").reverse().join("/")}
            </Badge>
          </div>

          {classList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma turma vinculada
            </p>
          ) : (
            <div className="space-y-2">
              {classList.map(cls => {
                const hasSession = classesWithSessionToday.has(
                  cls.id as number
                );
                return (
                  <div
                    key={String(cls.id)}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {String(cls.displayName || cls.gradeLabel || cls.name || `Turma ${cls.id}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shiftLabel(cls.shift)} ·{" "}
                        {String(cls.subject || cls.gradeLabel || "—")}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Users className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {String(cls.students ?? "—")}
                      </span>
                      {hasSession ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        >
                          Chamada feita
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        >
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Turmas com mais faltas recentes */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="size-4 text-red-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Mais faltas — últimos 30 dias
            </h3>
          </div>

          {topAbsenteeClasses.length === 0 ? (
            <div className="rounded-lg border bg-card px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 size-6 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Sem faltas registradas nos últimos 30 dias
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topAbsenteeClasses.map((cls, idx) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? "bg-red-100 text-red-600 dark:bg-red-950"
                          : idx === 1
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-950"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-950"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {cls.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-red-400" />
                    <span className="text-sm font-semibold text-red-600">
                      {cls.absences}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      falta(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Últimas notas lançadas ──────────────────────────────────────────── */}
        {assessmentList.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <BookOpenCheck className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Últimas notas lançadas
              </h3>
            </div>
            <div className="space-y-2">
              {assessmentList.slice(0, 5).map(a => (
                <div
                  key={String(a.id)}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {String(a.title || a.name || "Avaliação")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.assessmentDate
                        ? new Date(String(a.assessmentDate)).toLocaleDateString(
                            "pt-BR"
                          )
                        : "Data não informada"}
                    </p>
                  </div>
                  {a.maxScore != null && (
                    <Badge variant="outline" className="ml-3 shrink-0">
                      Máx: {String(a.maxScore)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Avisos pendentes ────────────────────────────────────────────────── */}
        {notifList.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Bell className="size-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Avisos não lidos
              </h3>
            </div>
            <div className="space-y-2">
              {notifList.slice(0, 5).map(n => (
                <div
                  key={String(n.id)}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30"
                >
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    {String(n.title || n.subject || "Comunicado")}
                  </p>
                  {renderSafe(n.body) && (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                      {String(n.body).substring(0, 120)}
                      {String(n.body).length > 120 ? "…" : ""}
                    </p>
                  )}
                  {renderSafe(n.createdAt) && (
                    <p className="mt-1 text-xs text-amber-600/70 dark:text-amber-500/70">
                      {new Date(String(n.createdAt)).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Últimos comentários ─────────────────────────────────────────────── */}
        {commentList.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Últimos comentários
              </h3>
            </div>
            <div className="space-y-2">
              {commentList.slice(0, 5).map(c => {
                const cat = String(c.category);
                return (
                  <div
                    key={String(c.id)}
                    className="rounded-lg border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{categoryIcon(cat)}</span>
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {cat}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {c.createdAt
                          ? new Date(String(c.createdAt)).toLocaleDateString(
                              "pt-BR"
                            )
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">
                      {String(c.content).substring(0, 120)}
                      {String(c.content).length > 120 ? "…" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
