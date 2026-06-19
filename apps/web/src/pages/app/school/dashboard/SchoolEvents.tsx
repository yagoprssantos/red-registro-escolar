import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { CalendarClock, X } from "lucide-react";

function formatClassName(cls: RegistryRow): string {
  if (cls.displayName) return String(cls.displayName);
  const grade = String(cls.gradeLabel || "").trim();
  const course = String(cls.course || "").trim();
  const name = String(cls.name || "").trim();
  const gradeNum = parseInt(grade, 10);
  const gradeStr =
    !isNaN(gradeNum) && gradeNum > 0 && String(gradeNum) === grade
      ? `${gradeNum}º Ano`
      : grade;
  if (gradeStr && course) return `${gradeStr} — ${course}`;
  if (gradeStr && name && gradeStr.toLowerCase() !== name.toLowerCase())
    return `${gradeStr} — ${name}`;
  if (gradeStr) return gradeStr;
  return name || `Turma ${cls.id}`;
}
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

/* ---------------- TYPES SAFE ---------------- */

type EventType =
  | "prova"
  | "feriado"
  | "saida_antecipada"
  | "evento_escolar"
  | "reuniao";

type EventForm = {
  title: string;
  description: string;
  eventType: EventType;
  startsAt: string;
  target: "all" | "class";
  targetClassId: string;
};

/* ---------------- UI CONSTANTS ---------------- */

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "prova", label: "📝 Prova" },
  { value: "feriado", label: "🎉 Feriado" },
  { value: "saida_antecipada", label: "🕐 Saída antecipada" },
  { value: "evento_escolar", label: "🏫 Evento escolar" },
  { value: "reuniao", label: "🤝 Reunião" },
];

const EVENT_TYPE_BADGE: Record<EventType, string> = {
  prova: "📝 Prova",
  feriado: "🎉 Feriado",
  saida_antecipada: "🕐 Saída antecipada",
  evento_escolar: "🏫 Evento escolar",
  reuniao: "🤝 Reunião",
};

/* ---------------- COMPONENT ---------------- */

export default function SchoolEvents() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const { data: events } = trpc.registry.list.useQuery(
    {
      entity: "schoolEvents",
      filters: schoolId ? { schoolId } : {},
      limit: 100,
      orderBy: "startsAt",
      orderDirection: "desc",
    },
    { enabled: !!schoolId }
  );

  const { data: classes } = trpc.registry.list.useQuery(
    {
      entity: "classes",
      filters: schoolId ? { schoolId } : {},
      limit: 200,
    },
    { enabled: !!schoolId }
  );

  const { data: eventTargets } = trpc.registry.list.useQuery({
    entity: "eventTargets",
    limit: 500,
  });

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    eventType: "evento_escolar",
    startsAt: "",
    target: "all",
    targetClassId: "",
  });

  const createEvent = trpc.events.create.useMutation();
  const createEventTarget = trpc.registry.create.useMutation();

  const eventList = (events ?? []) as RegistryRow[];
  const classList = (classes ?? []) as RegistryRow[];
  const targetList = (eventTargets ?? []) as RegistryRow[];

  function getEventTargetClass(eventId: number) {
    const target = targetList.find(
      t => t.eventId === eventId && t.targetType === "class"
    );
    if (!target) return null;

    const cls = classList.find(c => c.id === target.targetId);
    return cls ? String(cls.name) : null;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!schoolId) return;

    try {
      const result = await createEvent.mutateAsync({
        schoolId,
        title: form.title,
        description: form.description || null,
        eventType: form.eventType,
        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : new Date().toISOString(),
        targetConfig: form.target,
      });

      if (form.target === "class" && form.targetClassId) {
        await createEventTarget.mutateAsync({
          entity: "eventTargets",
          data: {
            eventId: (result as RegistryRow).id as number,
            targetType: "class",
            targetId: Number(form.targetClassId),
          },
        });
      }

      toast.success("Evento criado!");

      setShowForm(false);
      setForm({
        title: "",
        description: "",
        eventType: "evento_escolar",
        startsAt: "",
        target: "all",
        targetClassId: "",
      });
    } catch {
      toast.error("Erro ao criar evento");
    }
  }

  const grouped: Record<string, RegistryRow[]> = {};

  for (const event of eventList) {
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
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Eventos</h2>

        <Button
          onClick={() => setShowForm(true)}
          className="bg-red-brand hover:bg-red-700"
        >
          <CalendarClock className="mr-2 size-4" />
          Novo Evento
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex justify-between">
            <CardTitle>Novo Evento</CardTitle>
            <button onClick={() => setShowForm(false)}>
              <X className="size-4" />
            </button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Título"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
              />

              <textarea
                className="w-full border rounded p-2"
                placeholder="Descrição"
                value={form.description}
                onChange={e =>
                  setForm(p => ({ ...p, description: e.target.value }))
                }
              />

              <select
                value={form.eventType}
                onChange={e =>
                  setForm(p => ({
                    ...p,
                    eventType: e.target.value as EventType,
                  }))
                }
                className="w-full border p-2 rounded"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={e =>
                  setForm(p => ({ ...p, startsAt: e.target.value }))
                }
                required
              />

              <select
                value={form.target}
                onChange={e =>
                  setForm(p => ({
                    ...p,
                    target: e.target.value as "all" | "class",
                  }))
                }
                className="w-full border p-2 rounded"
              >
                <option value="all">Todos</option>
                <option value="class">Turma</option>
              </select>

              {form.target === "class" && (
                <select
                  value={form.targetClassId}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      targetClassId: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="">Selecione turma</option>
                  {classList.map(c => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {formatClassName(c)}
                    </option>
                  ))}
                </select>
              )}

              <Button type="submit" disabled={createEvent.isPending}>
                Criar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([month, events]) => (
        <div key={month} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{month}</h3>

          {events.map(event => {
            const targetClass = getEventTargetClass(event.id as number);
            return (
              <div key={String(event.id)} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                  {EVENT_TYPE_BADGE[event.eventType as EventType]?.split(" ")[0] ?? "📅"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{String(event.title)}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {event.startsAt
                        ? new Date(String(event.startsAt)).toLocaleDateString("pt-BR")
                        : ""}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {EVENT_TYPE_BADGE[event.eventType as EventType]?.split(" ").slice(1).join(" ") ?? String(event.eventType)}
                    </span>
                    {targetClass && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {targetClass}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {String(event.description)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
