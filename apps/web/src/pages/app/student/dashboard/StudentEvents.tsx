import { trpc } from "@/lib/trpc";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Event = {
  id: number;
  title: string;
  eventType: string;
  eventDate: string;
  description: string | null;
};

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

export default function StudentEvents() {
  const [filter, setFilter] = useState<string>("all");
  const { data: events, isLoading } = trpc.profiles.student.events.useQuery();

  const allEvents = (events ?? []) as Event[];
  const filtered =
    filter === "all" ? allEvents : allEvents.filter(e => e.eventType === filter);

  // Group by month
  const grouped: Record<string, Event[]> = {};
  for (const event of filtered) {
    const date = event.eventDate
      ? new Date(event.eventDate + "T00:00:00").toLocaleDateString("pt-BR", {
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

      {isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">Carregando eventos...</p>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <CalendarClock className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhum evento próximo</p>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{month}</h3>
          <div className="space-y-2">
            {monthEvents.map(event => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <CalendarClock className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.eventDate
                      ? new Date(event.eventDate + "T00:00:00").toLocaleDateString("pt-BR")
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
