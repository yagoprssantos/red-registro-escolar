import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { Bell, CalendarClock, Check } from "lucide-react";
import { useState } from "react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  prova: "📝 Prova",
  feriado: "🏖️ Feriado",
  saida_antecipada: "🕐 Saída antecipada",
  evento_escolar: "🏫 Evento escolar",
  reuniao: "🤝 Reunião",
};

type Tab = "communications" | "events";

export default function StudentNotices() {
  const [tab, setTab] = useState<Tab>("communications");
  const [commFilter, setCommFilter] = useState<"all" | "unread">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { data: me } = trpc.profiles.student.me.useQuery();
  const student = me as RegistryRow | null | undefined;

  const { data: enrollments } = trpc.registry.list.useQuery(
    {
      entity: "classEnrollments" as const,
      filters: { studentId: student?.id, status: "ativo" },
      limit: 10,
    },
    { enabled: !!student?.id }
  );
  const classId = ((enrollments ?? []) as RegistryRow[])[0]?.classId as
    | number
    | undefined;

  // Communications
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;
  const { data: communications } = trpc.communications.forUser.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );
  const markRead = trpc.communications.markRead.useMutation();
  const allComms = (communications ?? []) as RegistryRow[];
  const filteredComms =
    commFilter === "unread" ? allComms.filter(c => !c.readAt) : allComms;

  // Events
  const { data: communications2 } =
    trpc.profiles.student.communications.useQuery(undefined, {
      enabled: false,
    });
  const { data: events } = trpc.registry.list.useQuery({
    entity: "schoolEvents" as const,
    limit: 200,
    orderBy: "startsAt",
    orderDirection: "asc",
  });
  const { data: eventTargets } = trpc.registry.list.useQuery({
    entity: "eventTargets" as const,
    limit: 500,
  });
  const eventList = (events ?? []) as RegistryRow[];
  const targetList = (eventTargets ?? []) as RegistryRow[];

  const myEvents = eventList.filter(evt => {
    const targets = targetList.filter(t => t.eventId === evt.id);
    if (targets.length === 0) return true;
    return targets.some(
      t =>
        t.targetType === "all" ||
        t.targetType === "school" ||
        (t.targetType === "class" && t.targetRefId === classId)
    );
  });
  const filteredEvents =
    eventFilter === "all"
      ? myEvents
      : myEvents.filter(e => String(e.eventType) === eventFilter);

  const eventFilters = [
    { value: "all", label: "Todos" },
    { value: "prova", label: "📝 Provas" },
    { value: "feriado", label: "🏖️ Feriados" },
    { value: "evento_escolar", label: "🏫 Eventos" },
    { value: "saida_antecipada", label: "🕐 Saídas" },
  ];

  // Group events by month
  const groupedEvents: Record<string, RegistryRow[]> = {};
  for (const event of filteredEvents) {
    const date = event.startsAt
      ? new Date(String(event.startsAt)).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })
      : "Sem data";
    if (!groupedEvents[date]) groupedEvents[date] = [];
    groupedEvents[date].push(event);
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("communications")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "communications"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Bell className="size-3.5" /> Comunicados
        </button>
        <button
          onClick={() => setTab("events")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "events"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <CalendarClock className="size-3.5" /> Eventos
        </button>
      </div>

      {/* Communications tab */}
      {tab === "communications" && (
        <>
          <div className="flex items-center justify-end">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setCommFilter("all")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  commFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCommFilter("unread")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  commFilter === "unread"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Não lidos
              </button>
            </div>
          </div>

          {filteredComms.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum comunicado {commFilter === "unread" ? "não lido" : ""}
            </p>
          )}

          <div className="space-y-2">
            {filteredComms.map(comm => (
              <Card key={String(comm.id)}>
                <CardContent className="flex items-start gap-3 py-4">
                  <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {String(comm.title)}
                      </p>
                      {!comm.readAt && (
                        <span className="rounded-full bg-red-brand/10 px-2 py-0.5 text-xs font-medium text-red-brand">
                          Novo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {String(comm.body).substring(0, 200)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {comm.createdAt
                        ? new Date(String(comm.createdAt)).toLocaleDateString(
                            "pt-BR"
                          )
                        : ""}
                    </p>
                  </div>
                  {!comm.readAt && (
                    <button
                      onClick={() =>
                        markRead.mutate({ communicationId: comm.id as number })
                      }
                      className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                      disabled={markRead.isPending}
                    >
                      <Check className="size-3" /> Marcar como lido
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Events tab */}
      {tab === "events" && (
        <>
          <div className="flex flex-wrap gap-1">
            {eventFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setEventFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  eventFilter === f.value
                    ? "bg-muted text-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum evento
            </p>
          )}

          {Object.entries(groupedEvents).map(([month, evts]) => (
            <div key={month}>
              <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
                {month}
              </h3>
              <div className="space-y-2">
                {evts.map(event => (
                  <div
                    key={String(event.id)}
                    className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {String(event.title)}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {EVENT_TYPE_LABELS[String(event.eventType)] ??
                            String(event.eventType)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {String(event.description)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.startsAt
                          ? new Date(String(event.startsAt)).toLocaleDateString(
                              "pt-BR"
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
