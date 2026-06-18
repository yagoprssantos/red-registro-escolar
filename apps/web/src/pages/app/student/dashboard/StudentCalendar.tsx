import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

const EVENT_TYPE_COLORS: Record<string, string> = {
  prova:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700",
  feriado:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700",
  saida_antecipada:
    "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700",
  evento_escolar:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700",
  reuniao:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  prova: "📝 Prova",
  feriado: "🏖️ Feriado",
  saida_antecipada: "🕐 Saída Antecipada",
  evento_escolar: "🏫 Evento",
  reuniao: "🤝 Reunião",
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function StudentCalendar() {
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

  const eventsByMonth: Record<string, RegistryRow[]> = {};
  for (const evt of myEvents) {
    const date = evt.startsAt ? new Date(String(evt.startsAt)) : null;
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!eventsByMonth[key]) eventsByMonth[key] = [];
    eventsByMonth[key].push(evt);
  }
  const sortedMonths = Object.keys(eventsByMonth).sort();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="size-5" />
        Calendário Letivo
      </h2>

      {sortedMonths.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Calendar className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhum evento no calendário</p>
          </CardContent>
        </Card>
      )}

      {sortedMonths.map(monthKey => {
        const [year, month] = monthKey.split("-").map(Number);
        const monthEvents = eventsByMonth[monthKey];
        return (
          <Card key={monthKey}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {MONTHS[month - 1]} {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {monthEvents.map(evt => {
                const date = evt.startsAt
                  ? new Date(String(evt.startsAt))
                  : new Date();
                const dayStr = date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                });
                const type = String(evt.eventType ?? "evento_escolar");
                const color =
                  EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.evento_escolar;
                const label = EVENT_TYPE_LABELS[type] ?? "📅 Evento";

                return (
                  <div
                    key={String(evt.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${color}`}
                  >
                    <div className="text-center min-w-[3rem]">
                      <p className="text-lg font-bold leading-none">
                        {date.getDate()}
                      </p>
                      <p className="text-[10px] uppercase">
                        {dayStr.split(" ")[1] ?? ""}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {String(evt.title)}
                      </p>
                      {evt.description && (
                        <p className="text-xs mt-0.5 opacity-80 line-clamp-2">
                          {String(evt.description)}
                        </p>
                      )}
                      <span className="mt-1 inline-block text-[10px] font-medium opacity-70">
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
