import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function StudentGrades() {
  const { data: grades } = trpc.profiles.student.grades.useQuery();
  const gradeList = (grades ?? []) as RegistryRow[];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Minhas Notas</h2>

      {gradeList.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma nota lançada</p>
      )}

      <div className="space-y-2">
        {gradeList
          .sort((a, b) => {
            const dateA = String(a.assessmentDate || a.createdAt || "");
            const dateB = String(b.assessmentDate || b.createdAt || "");
            return dateB.localeCompare(dateA);
          })
          .map((grade, idx) => {
            const score = Number(grade.score);
            const maxScore = Number(grade.maxScore) || 10;
            const normalizedScore = (score / maxScore) * 10;
            const prevGrade = gradeList[idx + 1]; // sorted desc, so next is older
            const prevScore = prevGrade
              ? (Number(prevGrade.score) / (Number(prevGrade.maxScore) || 10)) *
                10
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
              <Card key={String(grade.id)}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {String(grade.title || "Avaliação")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {grade.assessmentDate
                        ? new Date(
                            String(grade.assessmentDate)
                          ).toLocaleDateString("pt-BR")
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
                        {grade.score != null ? String(grade.score) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{maxScore}
                      </span>
                    </div>
                    {trend === "up" && (
                      <TrendingUp className="size-4 text-green-600" />
                    )}
                    {trend === "down" && (
                      <TrendingDown className="size-4 text-red-500" />
                    )}
                    {trend === "stable" && (
                      <Minus className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
