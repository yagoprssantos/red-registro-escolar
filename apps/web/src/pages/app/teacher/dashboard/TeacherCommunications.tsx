import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, MessageSquare } from "lucide-react";
import { useState } from "react";
import type { RegistryRow } from "../../../shared/DashboardShell";

type Filter = "all" | "unread";

export default function TeacherCommunications() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const { data: communications } = trpc.communications.forUser.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const markRead = trpc.communications.markRead.useMutation({
    onSuccess: () => {
      // Refetch handled by React Query invalidation
    },
  });

  const allComms = (communications ?? []) as RegistryRow[];
  const filtered =
    filter === "unread" ? allComms.filter(c => !c.readAt) : allComms;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Comunicados</h2>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === "unread"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Não lidos
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum comunicado {filter === "unread" ? "não lido" : ""}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map(comm => (
          <Card key={String(comm.id)}>
            <CardContent className="flex items-start gap-3 py-4">
              <MessageSquare className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
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
                    markRead.mutate({
                      communicationId: comm.id as number,
                    })
                  }
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  disabled={markRead.isPending}
                >
                  <Check className="size-3" />
                  Marcar como lido
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
