import { trpc } from "@/lib/trpc";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import type { RegistryRow } from "../../../shared/DashboardShell";

const EVENT_TYPE_LABELS: Record<string, string> = {
  prova: "📝 Prova",
  feriado: "🎉 Feriado",
  saida_antecipada: "🕐 Saída antecipada",
  evento_escolar: "🏫 Evento escolar",
  reuniao: "🤝 Reunião",
};

const EVENT_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "prova", label: "📝 Provas" },
  { value: "feriado", label: "🎉 Feriados" },
  { value: "evento_escolar", label: "🏫 Eventos" },
  { value: "saida_antecipada", label: "🕐 Saídas" },
] as const;

export default function GuardianEvents() {
  const [filter, setFilter] = useState<string>("all");
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const { data: events } = trpc.events.forUser.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const allEvents = (events ?? []) as RegistryRow[];
  const filtered =
    filter === "all"
      ? allEvents
      : allEvents.filter(e => String(e.eventType) === filter);

  // Group by month
  const grouped: Record<string, RegistryRow[]> = {};
  for (const event of filtered) {
    const date = event.startsAt
      ? new Date(String(event.startsAt)).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })
      : "Sem data";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(event);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Eventos</h2>

      {/* Event type filter */}
      <div className="flex flex-wrap gap-1">
        {EVENT_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-muted text-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum evento</p>
      )}

      {Object.entries(grouped).map(([month, events]) => (
        <div key={month}>
          <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
            {month}
          </h3>
          <div className="space-y-2">
            {events.map(event => (
              <div
                key={String(event.id)}
                className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <CalendarClock className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
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
    </div>
  );
}
