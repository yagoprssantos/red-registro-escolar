import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3 } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

function scoreColor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 70) return "text-green-600 dark:text-green-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 70) return "bg-green-100 dark:bg-green-950/20";
  if (pct >= 50) return "bg-amber-100 dark:bg-amber-950/20";
  return "bg-red-100 dark:bg-red-950/20";
}

export default function StudentTranscript() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const student = me as RegistryRow | null | undefined;

  const { data: gradesData } = trpc.profiles.student.grades.useQuery(
    undefined,
    {
      enabled: !!student,
    }
  );
  const scores = (gradesData ?? []) as RegistryRow[];

  const { data: assessments } = trpc.registry.list.useQuery({
    entity: "assessments" as const,
    limit: 500,
  });
  const { data: classSubjects } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: 200,
  });
  const { data: subjectDefs } = trpc.registry.list.useQuery({
    entity: "subjects" as const,
    limit: 100,
  });

  const assessmentList = (assessments ?? []) as RegistryRow[];
  const csList = (classSubjects ?? []) as RegistryRow[];
  const subList = (subjectDefs ?? []) as RegistryRow[];

  // Group scores by subject
  const bySubject: Record<
    string,
    {
      name: string;
      scores: {
        title: string;
        score: number;
        maxScore: number;
        date: string;
      }[];
    }
  > = {};

  for (const s of scores) {
    const assessment = assessmentList.find(a => a.id === s.assessmentId);
    if (!assessment) continue;
    const cs = csList.find(c => c.id === assessment.classSubjectId);
    const subject = cs ? subList.find(sub => sub.id === cs.subjectId) : null;
    const subjectName = String(subject?.name ?? "Disciplina");

    if (!bySubject[subjectName])
      bySubject[subjectName] = { name: subjectName, scores: [] };
    bySubject[subjectName].scores.push({
      title: String(assessment.title ?? "Avaliação"),
      score: Number(s.score ?? 0),
      maxScore: Number(assessment.maxScore ?? 10),
      date: assessment.assessmentDate ? String(assessment.assessmentDate) : "",
    });
  }

  const subjectNames = Object.keys(bySubject).sort();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="size-5" />
        Boletim Escolar
      </h2>

      {subjectNames.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <BarChart3 className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhuma nota lançada ainda</p>
          </CardContent>
        </Card>
      )}

      {subjectNames.map(name => {
        const subject = bySubject[name];
        const avg =
          subject.scores.length > 0
            ? subject.scores.reduce(
                (sum, s) =>
                  sum + (s.maxScore > 0 ? (s.score / s.maxScore) * 10 : 0),
                0
              ) / subject.scores.length
            : 0;
        const avgDisplay = avg.toFixed(1);

        return (
          <Card key={name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{name}</CardTitle>
                <div
                  className={`rounded-lg px-3 py-1 text-sm font-bold ${scoreBg(avg, 10)} ${scoreColor(avg, 10)}`}
                >
                  Média: {avgDisplay}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {subject.scores.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{s.title}</span>
                      {s.date && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(s.date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-bold ${scoreColor(s.score, s.maxScore)}`}
                    >
                      {s.score}/{s.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
