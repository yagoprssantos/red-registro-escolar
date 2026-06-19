import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export default function StudentGrades() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const studentId = (me as Record<string, unknown> | null | undefined)?.id as number | undefined;

  const { data: scoresData } = trpc.registry.list.useQuery(
    { entity: "assessmentScores" as const, filters: studentId ? { studentId } : {}, limit: 100 },
    { enabled: !!studentId }
  );
  const { data: assessmentsData } = trpc.registry.list.useQuery({
    entity: "assessments" as const,
    limit: 500,
  });
  const { data: classSubjectsData } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: 200,
  });
  const { data: subjectDefs } = trpc.registry.list.useQuery({
    entity: "subjects" as const,
    limit: 100,
  });

  const scoreList = (scoresData ?? []) as RegistryRow[];
  const assessmentList = (assessmentsData ?? []) as RegistryRow[];
  const csList = (classSubjectsData ?? []) as RegistryRow[];
  const subList = (subjectDefs ?? []) as RegistryRow[];

  const gradeList = scoreList
    .map(s => {
      const assessment = assessmentList.find(a => a.id === s.assessmentId);
      const cs = assessment ? csList.find(c => c.id === assessment.classSubjectId) : null;
      const subject = cs ? subList.find(sub => sub.id === cs.subjectId) : null;
      return {
        id: s.id as number,
        title: String(assessment?.title ?? "Avaliação"),
        score: Number(s.score ?? 0),
        maxScore: Number(assessment?.maxScore ?? 10),
        assessmentDate: assessment?.assessmentDate ? String(assessment.assessmentDate) : "",
        subject: String(subject?.name ?? "—"),
      };
    })
    .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Minhas Notas</h2>

      {gradeList.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma nota lançada</p>
      )}

      <div className="space-y-2">
        {gradeList.map((grade, idx) => {
          const maxScore = grade.maxScore;
          const normalizedScore = maxScore > 0 ? (grade.score / maxScore) * 10 : 0;
          const prevGrade = gradeList[idx + 1];
          const prevScore = prevGrade
            ? prevGrade.maxScore > 0
              ? (prevGrade.score / prevGrade.maxScore) * 10
              : 0
            : null;
          const trend =
            prevScore != null
              ? normalizedScore > prevScore + 0.3
                ? "up"
                : normalizedScore < prevScore - 0.3
                  ? "down"
                  : "stable"
              : null;

          return (
            <Card key={grade.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{grade.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {grade.subject}
                    {grade.assessmentDate
                      ? ` — ${new Date(grade.assessmentDate + "T00:00:00").toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold ${
                        normalizedScore >= 7
                          ? "text-green-600"
                          : normalizedScore >= 5
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {grade.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/{maxScore}</span>
                  </div>
                  {trend === "up" && <TrendingUp className="size-4 text-green-600" />}
                  {trend === "down" && <TrendingDown className="size-4 text-red-500" />}
                  {trend === "stable" && <Minus className="size-4 text-muted-foreground" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
