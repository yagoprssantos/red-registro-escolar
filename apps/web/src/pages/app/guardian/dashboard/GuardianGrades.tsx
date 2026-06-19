import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { BookOpenCheck, ClipboardList } from "lucide-react";
import { useEffect } from "react";
import GuardianStudentCard from "../GuardianStudentCard";
import { useGuardianStudent } from "../useGuardianStudent";

export default function GuardianGrades() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const { selectedStudentId, setSelectedStudentId } = useGuardianStudent();

  const studentList = (students ?? []) as Array<{
    id: number;
    name: string | null;
    grade: string | null;
    enrollmentNumber: string | null;
    averageGrade: number;
  }>;

  // Auto-select first student
  useEffect(() => {
    if (studentList.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(studentList[0].id);
    }
  }, [studentList, selectedStudentId, setSelectedStudentId]);

  // Assessment scores for selected student
  const { data: scoresData, isLoading: scoresLoading } = trpc.registry.list.useQuery(
    {
      entity: "assessmentScores" as const,
      filters: { studentId: selectedStudentId! },
      limit: 500,
      orderBy: "createdAt",
      orderDirection: "desc",
    },
    { enabled: !!selectedStudentId }
  );

  // Assessments (to get title, maxScore, date)
  const { data: assessmentsData } = trpc.registry.list.useQuery(
    { entity: "assessments" as const, limit: 500 },
    { enabled: !!selectedStudentId }
  );

  // ClassSubjects (to get subjectId)
  const { data: classSubjectsData } = trpc.registry.list.useQuery(
    { entity: "classSubjects" as const, limit: 200 },
    { enabled: !!selectedStudentId }
  );

  // Subjects (to get name)
  const { data: subjectsData } = trpc.registry.list.useQuery(
    { entity: "subjects" as const, limit: 100 },
    { enabled: !!selectedStudentId }
  );

  const scores = (scoresData ?? []) as RegistryRow[];
  const assessments = (assessmentsData ?? []) as RegistryRow[];
  const classSubjects = (classSubjectsData ?? []) as RegistryRow[];
  const subjects = (subjectsData ?? []) as RegistryRow[];

  // Enrich scores with assessment and subject info
  type EnrichedScore = {
    id: number;
    score: number;
    maxScore: number;
    title: string;
    subjectName: string;
    assessmentDate: string | null;
    pct: number;
  };

  const enriched: EnrichedScore[] = scores.map(s => {
    const assessment = assessments.find(a => a.id === s.assessmentId);
    const cs = classSubjects.find(c => c.id === assessment?.classSubjectId);
    const subject = subjects.find(sub => sub.id === cs?.subjectId);
    const maxScore = Number(assessment?.maxScore ?? 10);
    const score = Number(s.score ?? 0);
    return {
      id: s.id as number,
      score,
      maxScore,
      title: String(assessment?.title ?? "Avaliação"),
      subjectName: String(subject?.name ?? assessment?.subjectName ?? "—"),
      assessmentDate: assessment?.assessmentDate ? String(assessment.assessmentDate) : null,
      pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    };
  });

  // Group by subject
  const bySubject = enriched.reduce<Record<string, EnrichedScore[]>>((acc, item) => {
    const key = item.subjectName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const gradeColor = (pct: number) =>
    pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600";

  const badgeClass = (pct: number) =>
    pct >= 70
      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
      : pct >= 50
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";

  return (
    <div className="space-y-6">
      {/* Student identity card */}
      <GuardianStudentCard
        students={studentList}
        selectedStudentId={selectedStudentId}
        onSelect={setSelectedStudentId}
      />

      {!selectedStudentId && (
        <p className="text-sm text-muted-foreground">Selecione um aluno para ver o desempenho</p>
      )}

      {selectedStudentId && scoresLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {selectedStudentId && !scoresLoading && enriched.length === 0 && (
        <div className="rounded-lg border bg-card px-4 py-10 text-center">
          <ClipboardList className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma avaliação lançada</p>
        </div>
      )}

      {/* Per-subject grade cards (grid) */}
      {Object.entries(bySubject).map(([subjectName, items]) => {
        const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
        const avgPct = items[0] ? Math.round((avg / items[0].maxScore) * 100) : 0;
        return (
          <section key={subjectName}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{subjectName}</h3>
              </div>
              <span className={`text-sm font-bold ${gradeColor(avgPct)}`}>
                Média: {avg.toFixed(1)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-medium leading-tight">
                      {item.title}
                    </CardTitle>
                    {item.assessmentDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.assessmentDate + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex items-end justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${gradeColor(item.pct)}`}>
                          {item.score}
                        </span>
                        <span className="text-sm text-muted-foreground">/{item.maxScore}</span>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${badgeClass(item.pct)}`}>
                        {item.pct}%
                      </Badge>
                    </div>
                    {/* Score bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={`h-1.5 rounded-full transition-all ${item.pct >= 70 ? "bg-green-500" : item.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
