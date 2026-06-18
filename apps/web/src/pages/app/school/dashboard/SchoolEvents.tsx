import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { RegistryRow } from "../../../shared/DashboardShell";

const EVENT_TYPES = [
  { value: "prova", label: "📝 Prova" },
  { value: "feriado", label: "🎉 Feriado" },
  { value: "saida_antecipada", label: "🕐 Saída antecipada" },
  { value: "evento_escolar", label: "🏫 Evento escolar" },
  { value: "reuniao", label: "🤝 Reunião" },
];

const EVENT_TYPE_BADGE: Record<string, string> = {
  prova: "📝 Prova",
  feriado: "🎉 Feriado",
  saida_antecipada: "🕐 Saída antecipada",
  evento_escolar: "🏫 Evento escolar",
  reuniao: "🤝 Reunião",
};

export default function SchoolEvents() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const { data: events } = trpc.registry.list.useQuery(
    {
      entity: "schoolEvents" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 100,
      orderBy: "startsAt",
      orderDirection: "desc",
    },
    { enabled: !!schoolId }
  );
  const { data: classes } = trpc.registry.list.useQuery(
    {
      entity: "classes" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 200,
    },
    { enabled: !!schoolId }
  );
  const { data: eventTargets } = trpc.registry.list.useQuery({
    entity: "eventTargets" as const,
    limit: 500,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
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
        targetConfig: form.target as "all" | "class",
      });

      // Create class-specific target if needed
      if (form.target === "class" && form.targetClassId && result) {
        await createEventTarget.mutateAsync({
          entity: "eventTargets" as const,
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

  // Group by month
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
      <div className="flex items-center justify-between">
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
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Novo Evento</CardTitle>
              <button onClick={() => setShowForm(false)}>
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Título *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
              />
              <textarea
                placeholder="Descrição"
                value={form.description}
                onChange={e =>
                  setForm(p => ({ ...p, description: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tipo de evento
                </label>
                <select
                  value={form.eventType}
                  onChange={e =>
                    setForm(p => ({ ...p, eventType: e.target.value }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                type="datetime-local"
                placeholder="Data e hora *"
                value={form.startsAt}
                onChange={e =>
                  setForm(p => ({ ...p, startsAt: e.target.value }))
                }
                required
              />
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Público-alvo
                </label>
                <select
                  value={form.target}
                  onChange={e =>
                    setForm(p => ({ ...p, target: e.target.value }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="class">Turma específica</option>
                </select>
              </div>

              {form.target === "class" && (
                <select
                  value={form.targetClassId}
                  onChange={e =>
                    setForm(p => ({ ...p, targetClassId: e.target.value }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecionar turma...</option>
                  {classList.map(cls => (
                    <option key={String(cls.id)} value={String(cls.id)}>
                      {String(cls.name)} — {String(cls.gradeLabel || "")}
                    </option>
                  ))}
                </select>
              )}

              {/* Preview */}
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span>
                    {form.target === "all"
                      ? "Evento visível para toda a escola"
                      : form.targetClassId
                        ? `Evento para turma: ${String(classList.find(c => c.id === Number(form.targetClassId))?.name ?? "")}`
                        : "Selecione uma turma"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={createEvent.isPending}
                >
                  Criar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Event list grouped by month */}
      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum evento cadastrado
        </p>
      )}
      {Object.entries(grouped).map(([month, events]) => (
        <div key={month}>
          <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
            {month}
          </h3>
          <div className="space-y-2">
            {events.map(event => {
              const targetClass = getEventTargetClass(event.id as number);
              return (
                <div
                  key={String(event.id)}
                  className="flex items-start justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {String(event.title)}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {EVENT_TYPE_BADGE[String(event.eventType)] ??
                          String(event.eventType)}
                      </span>
                      {targetClass && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Turma: {targetClass}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {String(event.description)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {event.startsAt
                      ? new Date(String(event.startsAt)).toLocaleDateString(
                          "pt-BR"
                        )
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
