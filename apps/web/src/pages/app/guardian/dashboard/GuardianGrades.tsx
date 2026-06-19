import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { useState } from "react";

export default function GuardianGrades() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const studentList = (students ?? []) as RegistryRow[];

  const { data: performance } =
    trpc.profiles.guardian.studentPerformance.useQuery(
      { studentId: selectedStudentId! },
      { enabled: !!selectedStudentId }
    );

  const perf = performance as RegistryRow | null;
  const gradeList = (perf?.grades ?? perf?.assessments ?? []) as RegistryRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Aluno:</label>
        <select
          value={selectedStudentId ?? ""}
          onChange={e => setSelectedStudentId(Number(e.target.value) || null)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {studentList.map(s => (
            <option key={String(s.id)} value={String(s.id)}>
              {String(s.name)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        Diferença vs aluno: inclui comparativo com média da turma
      </p>

      {selectedStudentId && gradeList.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma nota disponível</p>
      )}

      <div className="space-y-2">
        {gradeList.map(grade => {
          const score = Number(grade.score);
          const maxScore = Number(grade.maxScore) || 10;
          const classAvg =
            grade.classAverage != null ? Number(grade.classAverage) : null;

          return (
            <Card key={String(grade.id)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
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
                  <div className="text-right">
                    <div>
                      <span
                        className={`text-lg font-bold ${
                          score / maxScore >= 0.7
                            ? "text-green-600"
                            : score / maxScore >= 0.5
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
                    {classAvg != null && (
                      <p className="text-xs text-muted-foreground">
                        Turma: {classAvg.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
