import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

type AttendanceToday = {
  percentage?: number;
  presentCount?: number;
  totalExpected?: number;
};

type AtRiskStudent = {
  studentName?: string;
  className?: string;
  absenceRate?: number;
};

type DashboardData = {
  attendanceToday?: AttendanceToday;
  studentsAtRisk?: AtRiskStudent[];
  pendingJustifications?: number;
  upcomingEvents?: { eventId?: unknown; title?: unknown; startsAt?: unknown; eventType?: unknown }[];
};

const COMM_TYPE_LABEL: Record<string, string> = {
  announcement: "Aviso",
  urgent: "Urgente",
  event: "Evento",
  reminder: "Lembrete",
};

export default function SchoolDashboard() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const { data: dashboard, isLoading, isError } = trpc.school.dashboard.useQuery(
    { schoolId: schoolId as number },
    { enabled: !!schoolId }
  );

  const dash: DashboardData = dashboard ?? {};
  const attendancePct = Number(dash.attendanceToday?.percentage ?? 0);
  const studentsAtRisk = dash.studentsAtRisk ?? [];
  const upcomingEvents = dash.upcomingEvents ?? [];
  const pendingJustifications = dash.pendingJustifications ?? 0;

  const { data: comms } = trpc.communications.listBySchool.useQuery(
    { schoolId: schoolId as number, limit: 5 },
    { enabled: !!schoolId }
  );

  const { data: justifications } = trpc.justifications.listBySchool.useQuery(
    { schoolId: schoolId as number, status: "pending" },
    { enabled: !!schoolId }
  );

  const jList = justifications ?? [];
  const commList = comms ?? [];

  const utils = trpc.useUtils();
  const reviewMutation = trpc.justifications.review.useMutation({
    onSuccess: () => {
      toast.success("Justificativa revisada!");
      utils.justifications.listBySchool.invalidate();
      utils.school.dashboard.invalidate();
    },
    onError: () => toast.error("Erro ao revisar justificativa"),
  });

  if (!schoolId) {
    return (
      <div className="text-sm text-muted-foreground">Nenhuma escola encontrada.</div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-40 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-sm text-red-500">Erro ao carregar dashboard.</div>;
  }

  const attendanceColor =
    attendancePct >= 85
      ? "text-green-600 dark:text-green-400"
      : attendancePct >= 70
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-500";

  return (
    <div className="space-y-6">
      {/* ── METRICS ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presença hoje</CardTitle>
            <GraduationCap className={`size-4 ${attendanceColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${attendanceColor}`}>{attendancePct}%</div>
            {dash.attendanceToday?.totalExpected ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {dash.attendanceToday.presentCount ?? 0} / {dash.attendanceToday.totalExpected} alunos
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alunos em alerta</CardTitle>
            <AlertTriangle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{studentsAtRisk.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">frequência {"<"} 75%</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Justificativas</CardTitle>
            <ShieldCheck className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingJustifications}</div>
            <p className="mt-1 text-xs text-muted-foreground">pendentes de revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos eventos</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingEvents.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">agendados</p>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Communications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              Comunicações recentes
            </CardTitle>
            <span className="text-xs text-muted-foreground">{commList.length} total</span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {commList.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum comunicado publicado
              </p>
            ) : (
              commList.slice(0, 5).map(comm => {
                const typeLabel = COMM_TYPE_LABEL[String(comm.communicationType)] ?? String(comm.communicationType ?? "Aviso");
                return (
                  <div
                    key={String(comm.id)}
                    className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5"
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug truncate">
                        {String(comm.title ?? "")}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {typeLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {comm.createdAt
                            ? new Date(String(comm.createdAt)).toLocaleDateString("pt-BR")
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Students at risk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              Alunos em alerta
            </CardTitle>
            <span className="text-xs text-muted-foreground">{studentsAtRisk.length} aluno{studentsAtRisk.length !== 1 ? "s" : ""}</span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {studentsAtRisk.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum aluno com baixa frequência
              </p>
            ) : (
              studentsAtRisk.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800 dark:bg-red-950/20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                      <Users className="size-3.5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-snug">{s.studentName ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{s.className ?? "—"}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-500">{Number(s.absenceRate ?? 0)}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending justifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-amber-500" />
              Justificativas pendentes
            </CardTitle>
            <span className="text-xs text-muted-foreground">{jList.length} aguardando</span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {jList.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma justificativa pendente
              </p>
            ) : (
              jList.slice(0, 3).map(j => (
                <div
                  key={String(j.id)}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/20"
                >
                  <p className="text-sm font-medium line-clamp-1">
                    {String(j.reason ?? "").slice(0, 80)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        reviewMutation.mutate({
                          justificationId: Number(j.id),
                          status: "approved",
                        })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-3 text-xs"
                      onClick={() =>
                        reviewMutation.mutate({
                          justificationId: Number(j.id),
                          status: "rejected",
                        })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              Próximos eventos
            </CardTitle>
            <span className="text-xs text-muted-foreground">{upcomingEvents.length} evento{upcomingEvents.length !== 1 ? "s" : ""}</span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {upcomingEvents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum evento programado
              </p>
            ) : (
              upcomingEvents.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <CalendarClock className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{String(e.title ?? "—")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {e.startsAt
                        ? new Date(String(e.startsAt)).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </div>
                  {e.eventType ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground shrink-0">
                      {String(e.eventType)}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
