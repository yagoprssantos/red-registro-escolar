import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useAuth } from "@/core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { User } from "lucide-react";
import { useState } from "react";

export default function ViewComments() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "sent">("received");

  // Determine user role and appropriate visibility filters
  const userRole = user?.role; // "teacher", "student", "guardian", etc.

  // Fetch comments based on user role and tab
  const {
    data: comments = [],
    isLoading: isLoading,
    error,
  } = trpc.comments.forViewer.useQuery(
    {
      viewerId: user?.id ?? undefined,
      tab: tab,
      visibilityFilter: getVisibilityFilter(userRole, tab),
    },
    {
      enabled: !!user,
    }
  );

  // Get visibility filter based on user role and tab
  function getVisibilityFilter(
    role: string | undefined,
    tab: "received" | "sent"
  ): string[] {
    if (!role) return [];

    switch (role) {
      case "student":
        // Aluno vê apenas comments com visibility IN ('student', 'all')
        return tab === "received" ? ["student", "all"] : ["all"]; // Para sent, apenas aqueles que ele criou (visibility all por padrão)
      case "guardian":
        // Responsável vê apenas comments com visibility IN ('guardian', 'all')
        return tab === "received" ? ["guardian", "all"] : ["all"];
      case "teacher":
        // Professor vê todos os comments das suas turmas (simplificado)
        return ["all"];
      default:
        return ["all"];
    }
  }

  if (!user) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {tab === "received" ? "Comentários Recebidos" : "Meus Comentários"}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{comments.length} comentários</Badge>
        </div>
      </div>

      <Tabs
        defaultValue="received"
        value={tab}
        onValueChange={setTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="hover:underline">
            Comentários Recebidos
          </TabsTrigger>
          <TabsTrigger value="sent" className="hover:underline">
            Meus Comentários
          </TabsTrigger>
        </TabsList>
        <TabsContent value="received">
          {!isLoading && comments.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum comentário encontrado.
            </p>
          )}

          {isLoading && (
            <div className="h-96 flex items-center justify-center">
              <div className="space-y-3">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
              </div>
            </div>
          )}

          {!isLoading && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map(comment => (
                <Card key={comment.id} className="border">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="card-title text-sm font-semibold">
                        {comment.student?.name || "Aluno"}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString(
                          "pt-BR",
                          {
                            day: "2",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {comment.teacher && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>Por: {comment.teacher.name}</span>
                      </div>
                    )}
                    <div className="text-sm">{comment.content}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant={getBadgeVariant(comment.category)}>
                        {getCategoryLabel(comment.category)}
                      </Badge>
                      <Badge variant="secondary">
                        {getVisibilityLabel(comment.visibility)}
                      </Badge>
                    </div>
                  </CardContent>
                  {comment.teacherId === user.id && (
                    <CardFooter>
                      <button className="text-xs text-muted-foreground hover:underline">
                        Editar
                      </button>
                      <button className="text-xs text-muted-foreground hover:underline">
                        Excluir
                      </button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="sent">
          {/* Similar structure for sent comments */}
          <p className="text-center py-8">
            Visualização de comentários enviados em desenvolvimento.
          </p>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  );
}

// Helper functions
function getBadgeVariant(
  category: string
): "default" | "destructive" | "outline" | "secondary" {
  switch (category) {
    case "elogio":
      return "default";
    case "melhoria":
      return "outline";
    case "ocorrencia":
      return "destructive";
    case "comentario":
      return "secondary";
    default:
      return "secondary";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "elogio":
      return "Elogio";
    case "melhoria":
      return "Melhoria";
    case "ocorrencia":
      return "Ocorrência";
    case "comentario":
      return "Comentário";
    default:
      return category;
  }
}

function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case "student":
      return "Visível para Aluno";
    case "guardian":
      return "Visível para Responsável";
    case "school":
      return "Visível para Escola";
    case "all":
      return "Visível para Todos";
    default:
      return visibility;
  }
}
