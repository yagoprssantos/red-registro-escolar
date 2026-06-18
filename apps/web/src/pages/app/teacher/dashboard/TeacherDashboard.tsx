import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BookOpenCheck,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function TeacherDashboard() {
  const { data: teacherProfile } = trpc.profiles.teacher.me.useQuery();
  const { data: classes } = trpc.profiles.teacher.classes.useQuery();
  const { data: notifications } = trpc.registry.notifications.mine.useQuery({
    unreadOnly: true,
    limit: 10,
  });
  const { data: myComments } = trpc.comments.byTeacher.useQuery(
    { teacherId: ((teacherProfile as RegistryRow)?.id as number) ?? 0 },
    { enabled: !!teacherProfile }
  );
  const { data: assessments } = trpc.registry.list.useQuery(
    {
      entity: "assessments" as const,
      limit: 10,
      orderBy: "assessmentDate",
      orderDirection: "desc",
    },
    { enabled: !!teacherProfile }
  );

  const classList = (classes ?? []) as RegistryRow[];
  const commentList = (myComments ?? []) as RegistryRow[];
  const notifList = (notifications ?? []) as RegistryRow[];
  const assessmentList = (assessments ?? []) as RegistryRow[];

  // Check which classes have attendance today
  const today = new Date().toISOString().split("T")[0];
  const { data: todaySessions } = trpc.registry.list.useQuery(
    {
      entity: "classSessions" as const,
      filters: { lessonDate: today },
      limit: 200,
    },
    { enabled: classList.length > 0 }
  );
  const sessionList = (todaySessions ?? []) as RegistryRow[];
  const classesWithSessionToday = new Set(
    sessionList.map(s => s.classSubjectId as number)
  );

  // Classes without today's session = "pending attendance"
  const pendingAttendance = classList.filter(
    cls => !classesWithSessionToday.has(cls.id as number)
  ).length;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Minhas turmas</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classList.length}</div>
          </CardContent>
        </Card>

        <Card className={pendingAttendance > 0 ? "border-amber-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Chamadas pendentes
            </CardTitle>
            <ClipboardList
              className={
                pendingAttendance > 0
                  ? "size-4 text-amber-500"
                  : "size-4 text-green-500"
              }
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pendingAttendance > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {pendingAttendance}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingAttendance > 0
                ? "Turmas sem chamada hoje"
                : "Todas as chamadas registradas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Comentários recentes
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentList.length}</div>
          </CardContent>
        </Card>

        <Card className={notifList.length > 0 ? "border-amber-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Comunicados não lidos
            </CardTitle>
            <Bell
              className={
                notifList.length > 0
                  ? "size-4 text-amber-500"
                  : "size-4 text-muted-foreground"
              }
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifList.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Fazer chamada</p>
            <p className="text-xs text-muted-foreground">
              {pendingAttendance > 0
                ? `${pendingAttendance} turma(s) pendente(s)`
                : "Nenhuma pendência"}
            </p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950">
            <BookOpenCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Lançar notas</p>
            <p className="text-xs text-muted-foreground">
              {assessmentList.length} avaliação(ões)
            </p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Novo comentário</p>
            <p className="text-xs text-muted-foreground">
              {commentList.length} comentário(s) feitos
            </p>
          </div>
        </button>
      </div>

      {/* My classes */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Minhas turmas
        </h3>
        {classList.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma turma vinculada
          </p>
        )}
        <div className="space-y-2">
          {classList.map(cls => (
            <div
              key={String(cls.id)}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {String(cls.name || cls.gradeLabel)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {String(
                    cls.shift === "morning"
                      ? "Manhã"
                      : cls.shift === "afternoon"
                        ? "Tarde"
                        : cls.shift === "evening"
                          ? "Noite"
                          : "Integral"
                  )}
                  · Série {String(cls.gradeLabel || "—")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {String(cls.studentCount || "—")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent comments */}
      {commentList.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Últimos comentários
          </h3>
          <div className="space-y-2">
            {commentList.slice(0, 5).map(c => {
              const cat = String(c.category);
              return (
                <div
                  key={String(c.id)}
                  className="rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {cat === "elogio"
                        ? "⭐"
                        : cat === "melhoria"
                          ? "🔄"
                          : cat === "ocorrencia"
                            ? "⚠️"
                            : "💬"}
                    </span>
                    <span className="text-xs font-medium capitalize text-muted-foreground">
                      {cat}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.createdAt
                        ? new Date(String(c.createdAt)).toLocaleDateString(
                            "pt-BR"
                          )
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">
                    {String(c.content).substring(0, 100)}
                    {String(c.content).length > 100 ? "..." : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
