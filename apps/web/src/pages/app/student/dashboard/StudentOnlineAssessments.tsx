import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { CheckCircle, Clock, FileUp, Monitor, PencilLine } from "lucide-react";
import { useState } from "react";

type Tab = "provas" | "trabalhos" | "atividades";

type TaskItem = {
  id: number;
  title: string;
  description: string | null;
  taskType: string;
  dueDate: string;
  maxScore: number;
  subjectName: string;
  submission: {
    id: number;
    answer: string | null;
    fileUrl: string | null;
    score: number | null;
    feedback: string | null;
    submittedAt: string | null;
    gradedAt: string | null;
  } | null;
};

function AssessmentCard({ a, subjectName }: { a: RegistryRow; subjectName: string }) {
  const now = new Date().toISOString().split("T")[0];
  const deadline = String(a.assessmentDate ?? "");
  const isAvailable = deadline >= now;

  return (
    <Card className={!isAvailable ? "opacity-60" : ""}>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <h3 className="text-sm font-semibold">{String(a.title ?? "Avaliação")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subjectName} — Prazo:{" "}
            {deadline ? new Date(deadline + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${
            isAvailable ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {isAvailable ? (
            <>
              <Monitor className="size-4" />
              Disponível
            </>
          ) : (
            "Encerrada"
          )}
        </span>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, onSubmit }: { task: TaskItem; onSubmit: (taskId: number, answer: string) => void }) {
  const [answer, setAnswer] = useState("");
  const [expanded, setExpanded] = useState(false);
  const now = new Date().toISOString().split("T")[0];
  const isExpired = task.dueDate < now;
  const sub = task.submission;

  const statusLabel = sub?.gradedAt
    ? `Avaliado: ${sub.score}/${task.maxScore}`
    : sub?.submittedAt
      ? "Entregue (aguardando avaliação)"
      : isExpired
        ? "Prazo encerrado"
        : "Pendente";

  const statusColor = sub?.gradedAt
    ? "text-green-600"
    : sub?.submittedAt
      ? "text-amber-600"
      : isExpired
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{task.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {task.subjectName} — Prazo: {new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          </div>
          <span className={`text-xs font-medium ${statusColor} shrink-0`}>
            {statusLabel}
          </span>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}

        {sub?.feedback && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-800 dark:text-green-300">
            <span className="font-medium">Feedback: </span>{sub.feedback}
          </div>
        )}

        {!sub && !isExpired && task.taskType === "atividade" && (
          <div className="space-y-2">
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <PencilLine className="size-4" />
                Responder atividade
              </button>
            ) : (
              <>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  rows={4}
                  placeholder="Digite sua resposta aqui..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { onSubmit(task.id, answer); setExpanded(false); setAnswer(""); }}
                    disabled={!answer.trim()}
                    className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Enviar resposta
                  </button>
                  <button
                    onClick={() => { setExpanded(false); setAnswer(""); }}
                    className="rounded-md border px-4 py-1.5 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!sub && !isExpired && task.taskType === "trabalho" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileUp className="size-4" />
            <span>Entrega de arquivo — use o link da plataforma de upload da escola.</span>
          </div>
        )}

        {sub?.submittedAt && !sub.gradedAt && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="size-3.5" />
            Enviado em {new Date(sub.submittedAt).toLocaleDateString("pt-BR")} — aguardando avaliação do professor
          </div>
        )}

        {sub?.gradedAt && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle className="size-3.5" />
            Avaliado em {new Date(sub.gradedAt).toLocaleDateString("pt-BR")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentOnlineAssessments() {
  const [activeTab, setActiveTab] = useState<Tab>("provas");

  const { data: details, isLoading: loadingDetails } = trpc.profiles.student.classDetails.useQuery();
  const { data: tasksData, isLoading: loadingTasks, refetch } = trpc.tasks.forStudent.useQuery();
  const submitTask = trpc.tasks.submit.useMutation({ onSuccess: () => refetch() });

  const csIds = (details?.subjects ?? []).map(s => s.id);
  const { data: assessments, isLoading: loadingAssessments } = trpc.registry.list.useQuery(
    { entity: "assessments" as const, filters: csIds.length > 0 ? { classSubjectId: csIds } : {}, limit: 50, orderBy: "assessmentDate", orderDirection: "asc" },
    { enabled: csIds.length > 0 }
  );

  const isLoading = loadingDetails || loadingTasks || (csIds.length > 0 && loadingAssessments);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">Carregando avaliações...</p>
      </div>
    );
  }

  const allAssessments = (assessments ?? []) as RegistryRow[];
  const subjectsByCs = new Map((details?.subjects ?? []).map(s => [s.id, s.subjectName]));

  const taskList = (tasksData ?? []) as TaskItem[];
  const trabalhos = taskList.filter(t => t.taskType === "trabalho");
  const atividades = taskList.filter(t => t.taskType === "atividade");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "provas", label: "Provas", count: allAssessments.length },
    { key: "trabalhos", label: "Trabalhos", count: trabalhos.length },
    { key: "atividades", label: "Atividades", count: atividades.length },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Monitor className="size-5" />
        Avaliações Online
      </h2>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Provas tab */}
      {activeTab === "provas" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Avaliações e simulados cadastrados pelos professores.</p>
          {allAssessments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Monitor className="mx-auto size-10 opacity-30 mb-3" />
                <p className="text-sm">Nenhuma prova cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            allAssessments.map(a => (
              <AssessmentCard
                key={String(a.id)}
                a={a}
                subjectName={subjectsByCs.get(a.classSubjectId as number) ?? "—"}
              />
            ))
          )}
        </div>
      )}

      {/* Trabalhos tab */}
      {activeTab === "trabalhos" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Trabalhos com entrega de arquivo. O professor irá avaliar e lançar sua nota.
          </p>
          {trabalhos.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <FileUp className="mx-auto size-10 opacity-30 mb-3" />
                <p className="text-sm">Nenhum trabalho pendente</p>
              </CardContent>
            </Card>
          ) : (
            trabalhos.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSubmit={(taskId, answer) => submitTask.mutate({ taskId, answer })}
              />
            ))
          )}
        </div>
      )}

      {/* Atividades tab */}
      {activeTab === "atividades" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Atividades com resposta textual. Responda diretamente aqui. O professor avalia e a nota entra no boletim.
          </p>
          {atividades.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <PencilLine className="mx-auto size-10 opacity-30 mb-3" />
                <p className="text-sm">Nenhuma atividade pendente</p>
              </CardContent>
            </Card>
          ) : (
            atividades.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSubmit={(taskId, answer) => submitTask.mutate({ taskId, answer })}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
