import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { BookOpen, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { useState } from "react";

function gradeColor(avg: number) {
  if (avg >= 7) return "text-green-600";
  if (avg >= 5) return "text-amber-600";
  return "text-red-500";
}

function gradeBg(avg: number) {
  if (avg >= 7) return "bg-green-100 dark:bg-green-900/30";
  if (avg >= 5) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

type SubjectSummary = {
  subjectName: string;
  avg: number;
  totalWeight: number;
  assessments: Array<{
    id: number;
    title: string;
    score: number;
    maxScore: number;
    weight: number;
    date: string;
  }>;
};

export default function StudentGrades() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const { data: me } = trpc.profiles.student.me.useQuery();
  const studentId = (me as Record<string, unknown> | null | undefined)?.id as number | undefined;

  const { data: scoresData } = trpc.registry.list.useQuery(
    { entity: "assessmentScores" as const, filters: studentId ? { studentId } : {}, limit: 200 },
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

  const enriched = scoreList.map(s => {
    const assessment = assessmentList.find(a => a.id === s.assessmentId);
    const cs = assessment ? csList.find(c => c.id === assessment.classSubjectId) : null;
    const subject = cs ? subList.find(sub => sub.id === cs.subjectId) : null;
    return {
      id: s.id as number,
      title: String(assessment?.title ?? "Avaliação"),
      score: Number(s.score ?? 0),
      maxScore: Number(assessment?.maxScore ?? 10),
      weight: Number(assessment?.weight ?? 1),
      date: assessment?.assessmentDate ? String(assessment.assessmentDate) : "",
      subjectName: String(subject?.name ?? "—"),
      subjectId: String(cs?.subjectId ?? ""),
    };
  });

  // Group by subject
  const bySubject = new Map<string, SubjectSummary>();
  for (const item of enriched) {
    const key = item.subjectId || item.subjectName;
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        subjectName: item.subjectName,
        avg: 0,
        totalWeight: 0,
        assessments: [],
      });
    }
    bySubject.get(key)!.assessments.push({
      id: item.id,
      title: item.title,
      score: item.score,
      maxScore: item.maxScore,
      weight: item.weight,
      date: item.date,
    });
  }

  // Compute weighted averages
  const subjects: SubjectSummary[] = Array.from(bySubject.values()).map(s => {
    const totalWeight = s.assessments.reduce((acc, a) => acc + a.weight, 0);
    const weightedSum = s.assessments.reduce(
      (acc, a) => acc + (a.maxScore > 0 ? (a.score / a.maxScore) * 10 : 0) * a.weight,
      0
    );
    return {
      ...s,
      avg: totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0,
      totalWeight,
      assessments: [...s.assessments].sort((a, b) => b.date.localeCompare(a.date)),
    };
  }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const overallAvg =
    subjects.length > 0
      ? Math.round((subjects.reduce((acc, s) => acc + s.avg, 0) / subjects.length) * 10) / 10
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="size-5" />
          Boletim — 2026
        </h2>
        {overallAvg !== null && (
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${gradeBg(overallAvg)} ${gradeColor(overallAvg)}`}>
            Média geral: {overallAvg.toFixed(1)}
          </div>
        )}
      </div>

      {subjects.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <BookOpen className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhuma nota lançada ainda</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {subjects.map(s => {
          const isExpanded = expandedSubject === s.subjectName;
          return (
            <Card key={s.subjectName} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => setExpandedSubject(isExpanded ? null : s.subjectName)}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-lg text-lg font-bold ${gradeBg(s.avg)} ${gradeColor(s.avg)}`}>
                        {s.avg.toFixed(1)}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{s.subjectName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.assessments.length} avaliação{s.assessments.length !== 1 ? "ões" : ""}
                          {" · "}
                          {s.avg >= 7 ? "✅ Aprovado" : s.avg >= 5 ? "⚠️ Recuperação" : "❌ Em risco"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${s.avg >= 7 ? "bg-green-500" : s.avg >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(s.avg * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-3 px-4 border-t">
                  <div className="mt-3 space-y-1.5">
                    {s.assessments.map(a => {
                      const normalized = a.maxScore > 0 ? (a.score / a.maxScore) * 10 : 0;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium">{a.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {a.date
                                ? new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR")
                                : "—"}
                              {" · "}peso {a.weight}
                            </p>
                          </div>
                          <span className={`text-sm font-bold ${gradeColor(normalized)}`}>
                            {a.score}
                            <span className="text-xs font-normal text-muted-foreground">/{a.maxScore}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
