import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Clock, Eye, MessageSquare, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { RegistryRow } from "../../../shared/DashboardShell";

const TARGET_LABELS: Record<string, string> = {
  all: "Todos",
  guardians_only: "Somente responsáveis",
  teachers_only: "Somente professores",
  class: "Turma específica",
};

export default function SchoolCommunications() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const { data: comms } = trpc.registry.list.useQuery(
    {
      entity: "communications" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 100,
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
  const { data: recipients } = trpc.registry.list.useQuery({
    entity: "communicationRecipients" as const,
    limit: 2000,
  });
  const { data: users } = trpc.registry.list.useQuery({
    entity: "users" as const,
    limit: 500,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    target: "all",
    targetClassId: "",
    scheduledAt: "",
  });

  const createComm = trpc.communications.create.useMutation();

  const commList = (comms ?? []) as RegistryRow[];
  const classList = (classes ?? []) as RegistryRow[];
  const recipientList = (recipients ?? []) as RegistryRow[];
  const userList = (users ?? []) as RegistryRow[];

  // Calculate read stats per communication
  function getReadStats(commId: number) {
    const commRecipients = recipientList.filter(
      r => r.communicationId === commId
    );
    const total = commRecipients.length;
    const read = commRecipients.filter(r => r.readAt).length;
    return {
      total,
      read,
      pct: total > 0 ? Math.round((read / total) * 100) : 0,
    };
  }

  // Preview count of recipients
  function getPreviewCount() {
    if (form.target === "all") return userList.length;
    if (form.target === "guardians_only")
      return userList.filter(u => u.role === "guardian").length;
    if (form.target === "teachers_only")
      return userList.filter(u => u.role === "teacher").length;
    if (form.target === "class" && form.targetClassId) {
      // students + guardians in that class
      const classId = Number(form.targetClassId);
      const enrollments = userList.filter(u => u.classId === classId);
      return Math.max(enrollments.length, 1);
    }
    return 0;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!schoolId) return;

    try {
      await createComm.mutateAsync({
        schoolId,
        title: form.title,
        body: form.body,
        communicationType: "announcement",
        targetConfig: form.target as "all" | "guardians_only" | "teachers_only",
        scheduledAt: form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : undefined,
      });
      toast.success("Comunicado publicado!");
      setShowForm(false);
      setForm({
        title: "",
        body: "",
        target: "all",
        targetClassId: "",
        scheduledAt: "",
      });
    } catch {
      toast.error("Erro ao publicar comunicado");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Comunicados</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-red-brand hover:bg-red-700"
        >
          <MessageSquare className="mr-2 size-4" />
          Novo Comunicado
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Novo Comunicado</CardTitle>
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
                placeholder="Corpo do comunicado *"
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                required
              />
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Destinatários
                </label>
                <select
                  value={form.target}
                  onChange={e =>
                    setForm(p => ({ ...p, target: e.target.value }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="guardians_only">Somente responsáveis</option>
                  <option value="teachers_only">Somente professores</option>
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
                >
                  <option value="">Selecionar turma...</option>
                  {classList.map(cls => (
                    <option key={String(cls.id)} value={String(cls.id)}>
                      {String(cls.name)} — {String(cls.gradeLabel || "")}
                    </option>
                  ))}
                </select>
              )}

              {/* Preview count */}
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span>
                    Este comunicado chegará a{" "}
                    <strong>{getPreviewCount()}</strong> pessoa
                    {getPreviewCount() !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <label className="mb-1 block text-sm font-medium flex items-center gap-2">
                  <Clock className="size-4" />
                  Agendar publicação (opcional)
                </label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e =>
                    setForm(p => ({ ...p, scheduledAt: e.target.value }))
                  }
                />
                {!form.scheduledAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sem agendamento = publicação imediata
                  </p>
                )}
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
                  disabled={createComm.isPending}
                >
                  Publicar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Communication list with read stats */}
      <div className="space-y-2">
        {commList.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum comunicado publicado
          </p>
        )}
        {commList.map(comm => {
          const stats = getReadStats(comm.id as number);
          const isScheduled =
            comm.scheduledAt && new Date(String(comm.scheduledAt)) > new Date();
          return (
            <div
              key={String(comm.id)}
              className="rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{String(comm.title)}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {String(comm.communicationType || "aviso")}
                    </span>
                    {isScheduled && (
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                        Agendado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
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

                {/* Read stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1.5">
                    <Eye className="size-3 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {stats.read}/{stats.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.pct >= 80
                          ? "bg-green-500"
                          : stats.pct >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stats.pct}% leram
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
