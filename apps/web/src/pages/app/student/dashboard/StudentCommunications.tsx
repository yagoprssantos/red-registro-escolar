import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";

type Comm = {
  id: number;
  title: string;
  body: string;
  type?: string;
  createdAt: string;
};

export default function StudentCommunications() {
  const { data: communications, isLoading } = trpc.profiles.student.communications.useQuery();

  const allComms = (communications ?? []) as Comm[];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Comunicados</h2>

      {isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">Carregando comunicados...</p>
      )}

      {!isLoading && allComms.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Bell className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhum comunicado disponível</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {allComms.map(comm => (
          <Card key={comm.id}>
            <CardContent className="flex items-start gap-3 py-4">
              <Bell className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{comm.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {String(comm.body ?? "").substring(0, 200)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {comm.createdAt
                    ? new Date(String(comm.createdAt)).toLocaleDateString("pt-BR")
                    : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
