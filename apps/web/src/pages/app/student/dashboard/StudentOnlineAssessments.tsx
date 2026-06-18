import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Monitor } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function StudentOnlineAssessments() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const { data: enrollments } = trpc.registry.list.useQuery(
    {
      entity: "classEnrollments" as const,
      filters: { studentId: (me as RegistryRow)?.id, status: "ativo" },
      limit: 10,
    },
    { enabled: !!me }
  );
  const classId = ((enrollments ?? []) as RegistryRow[])[0]?.classId as
    | number
    | undefined;

  const { data: classSubjects } = trpc.registry.list.useQuery(
    {
      entity: "classSubjects" as const,
      filters: classId ? { classId } : {},
      limit: 30,
    },
    { enabled: !!classId }
  );
  const csIds = ((classSubjects ?? []) as RegistryRow[]).map(cs => cs.id);

  const { data: assessments } = trpc.registry.list.useQuery(
    {
      entity: "assessments" as const,
      limit: 50,
      orderBy: "assessmentDate",
      orderDirection: "asc",
    },
    { enabled: csIds.length > 0 }
  );
  const { data: subjectDefs } = trpc.registry.list.useQuery({
    entity: "subjects" as const,
    limit: 100,
  });

  const allAssessments = ((assessments ?? []) as RegistryRow[]).filter(a =>
    csIds.includes(a.classSubjectId as number)
  );
  const subDefs = ((subjectDefs ?? []) as RegistryRow[]);
  const csList = ((classSubjects ?? []) as RegistryRow[]);

  const now = new Date().toISOString().split("T")[0];
  const enriched = allAssessments.map(a => {
    const cs = csList.find(c => c.id === (a.classSubjectId as number));
    const subject = cs ? subDefs.find(s => s.id === cs.subjectId) : null;
    const deadline = String(a.assessmentDate ?? "");
    const status = deadline >= now ? "available" as const : "expired" as const;
    return {
      id: a.id as number,
      title: String(a.title ?? "Avaliação"),
      subject: String(subject?.name ?? "—"),
      deadline,
      status,
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Monitor className="size-5" />
        Avaliações Online
      </h2>

      <p className="text-sm text-muted-foreground">
        Avaliações e simulados disponíveis para realização online.
      </p>

      {enriched.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Monitor className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhuma avaliação online disponível</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {enriched.map(a => (
          <Card
            key={a.id}
            className={a.status === "expired" ? "opacity-60" : ""}
          >
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <h3 className="text-sm font-semibold">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.subject} — Prazo:{" "}
                  {a.deadline
                    ? new Date(a.deadline + "T00:00:00").toLocaleDateString(
                        "pt-BR"
                      )
                    : "—"}
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  a.status === "available"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {a.status === "available" ? (
                  <>
                    <ExternalLink className="size-4" />
                    Disponível
                  </>
                ) : (
                  "Encerrada"
                )}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
