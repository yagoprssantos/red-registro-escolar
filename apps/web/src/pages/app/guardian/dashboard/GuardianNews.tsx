import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, Megaphone } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

const EVENT_TYPE_ICONS: Record<string, string> = {
  prova: "📝",
  feriado: "🏖️",
  saida_antecipada: "🕐",
  evento_escolar: "🏫",
  reuniao: "🤝",
};

export default function GuardianNews() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const studentList = (students ?? []) as RegistryRow[];

  const { data: communications } = trpc.registry.list.useQuery({
    entity: "communications" as const,
    limit: 50,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
  const { data: events } = trpc.registry.list.useQuery({
    entity: "schoolEvents" as const,
    limit: 50,
    orderBy: "startsAt",
    orderDirection: "asc",
  });
  const { data: notifications } = trpc.registry.notifications.mine.useQuery({
    unreadOnly: false,
    limit: 30,
  });

  const commList = (communications ?? []) as RegistryRow[];
  const eventList = (events ?? []) as RegistryRow[];
  const notifList = (notifications ?? []) as RegistryRow[];

  // Upcoming events (from today forward)
  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = eventList.filter(e => {
    const startsAt = String(e.startsAt ?? "").split("T")[0];
    return startsAt >= today;
  });

  // Recent notifications (absence alerts + events)
  const recentAlerts = notifList.filter(n =>
    [
      "absence_alert",
      "event_reminder",
      "communication",
      "justification_result",
    ].includes(String(n.notificationType))
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Megaphone className="size-5" />
        Notícias e Avisos
      </h2>

      {/* Consecutive Absence Alert */}
      {studentList.map(st => {
        const studentId = st.id as number;
        const alerts = notifList.filter(
          n =>
            n.notificationType === "absence_alert" &&
            String(n.body ?? "").includes(String(st.name))
        );
        if (alerts.length === 0) return null;

        return (
          <Card
            key={String(studentId)}
            className="border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10"
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Alerta de Faltas — {String(st.name)}
                  </h3>
                  {alerts.slice(0, 2).map((a, i) => (
                    <p
                      key={i}
                      className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5"
                    >
                      {String(a.body ?? a.title)}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Upcoming Events & Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4" />
            Próximos Eventos e Reuniões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum evento próximo
            </p>
          )}
          {upcomingEvents.slice(0, 8).map(evt => {
            const date = evt.startsAt
              ? new Date(String(evt.startsAt))
              : new Date();
            const icon = EVENT_TYPE_ICONS[String(evt.eventType)] ?? "📅";

            return (
              <div
                key={String(evt.id)}
                className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-3"
              >
                <span className="text-lg">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{String(evt.title)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {evt.startsAt &&
                      ` — ${new Date(String(evt.startsAt)).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Communications / News */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" />
            Comunicados Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {commList.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum comunicado</p>
          )}
          {commList.slice(0, 10).map(comm => (
            <div
              key={String(comm.id)}
              className="rounded-lg border bg-card px-4 py-3"
            >
              <p className="text-sm font-medium">{String(comm.title)}</p>
              {comm.body && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {String(comm.body)}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {comm.createdAt
                  ? new Date(String(comm.createdAt)).toLocaleDateString("pt-BR")
                  : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="size-4" />
            Feed de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação recente
            </p>
          )}
          {recentAlerts.slice(0, 10).map(n => {
            const iconMap: Record<string, string> = {
              absence_alert: "🔴",
              event_reminder: "📅",
              communication: "📢",
              justification_result: "✅",
            };
            const icon = iconMap[String(n.notificationType)] ?? "🔔";

            return (
              <div
                key={String(n.id)}
                className={`flex items-start gap-3 rounded-lg px-3 py-3 ${
                  !n.isRead ? "bg-red-50/30 dark:bg-red-950/10" : "bg-muted/20"
                }`}
              >
                <span className="text-base">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium text-muted-foreground"}`}
                  >
                    {String(n.title ?? "")}
                  </p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {String(n.body)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
