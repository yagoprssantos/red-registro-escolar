import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CalendarClock,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function SchoolDashboard() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const { data: dashboard } = trpc.school.dashboard.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const dash = dashboard as RegistryRow | null;
  const attendanceToday = dash?.attendanceToday as RegistryRow | undefined;
  const attendancePct = attendanceToday?.percentage ?? 0;

  // Low-read communications
  const { data: comms } = trpc.communications.listBySchool.useQuery(
    { schoolId: schoolId!, limit: 10 },
    { enabled: !!schoolId }
  );
  const commList = (comms ?? []) as RegistryRow[];

  // Pending justifications for inline review
  const { data: justifications } = trpc.justifications.listBySchool.useQuery(
    { schoolId: schoolId!, status: "pending" },
    { enabled: !!schoolId }
  );
  const jList = (justifications ?? []) as RegistryRow[];

  const reviewMutation = trpc.justifications.review.useMutation({
    onSuccess: () => {},
    onError: () => {},
  });

  return (
    <div className="space-y-6">
      {/* Top metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Presença hoje</CardTitle>
            <GraduationCap
              className={
                attendancePct >= 85
                  ? "size-4 text-green-600"
                  : attendancePct >= 70
                    ? "size-4 text-amber-600"
                    : "size-4 text-red-500"
              }
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                attendancePct >= 85
                  ? "text-green-600"
                  : attendancePct >= 70
                    ? "text-amber-600"
                    : "text-red-500"
              }`}
            >
              {attendancePct || "—"}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Alunos em alerta
            </CardTitle>
            <AlertTriangle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {(dash?.studentsAtRisk as RegistryRow[])?.length ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Justificativas pendentes
            </CardTitle>
            <ShieldCheck className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {String(dash?.pendingJustifications ?? jList.length ?? "—")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Próximos eventos
            </CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dash?.upcomingEvents as RegistryRow[])?.length ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students at risk */}
      {(dash?.studentsAtRisk as RegistryRow[])?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Alunos em alerta (frequência {"<"} 75%)
          </h3>
          <div className="space-y-2">
            {(dash.studentsAtRisk as RegistryRow[]).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/20"
              >
                <div>
                  <p className="text-sm font-medium">{String(s.studentName)}</p>
                  <p className="text-xs text-muted-foreground">
                    Turma: {String(s.className)}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500">
                  {String(s.absenceRate)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communications with low read rate */}
      {commList.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="size-4" />
            Comunicações recentes
          </h3>
          <div className="space-y-2">
            {commList.slice(0, 5).map(comm => (
              <div
                key={String(comm.id)}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{String(comm.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {comm.createdAt
                      ? new Date(String(comm.createdAt)).toLocaleDateString(
                          "pt-BR"
                        )
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {String(comm.communicationType || "aviso")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick justification review */}
      {jList.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="size-4 text-amber-500" />
            Justificativas pendentes ({jList.length})
          </h3>
          <div className="space-y-2">
            {jList.slice(0, 3).map(j => (
              <div
                key={String(j.id)}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20"
              >
                <div>
                  <p className="text-sm font-medium">
                    {String(j.reason).substring(0, 60)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {j.createdAt
                      ? new Date(String(j.createdAt)).toLocaleDateString(
                          "pt-BR"
                        )
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() =>
                      reviewMutation.mutate({
                        justificationId: j.id as number,
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
                    onClick={() =>
                      reviewMutation.mutate({
                        justificationId: j.id as number,
                        status: "rejected",
                      })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {(dash?.upcomingEvents as RegistryRow[])?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="size-4" />
            Próximos eventos
          </h3>
          <div className="space-y-2">
            {(dash.upcomingEvents as RegistryRow[]).map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <p className="text-sm font-medium">{String(e.title)}</p>
                <span className="text-xs text-muted-foreground">
                  {e.startsAt
                    ? new Date(String(e.startsAt)).toLocaleDateString("pt-BR")
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
