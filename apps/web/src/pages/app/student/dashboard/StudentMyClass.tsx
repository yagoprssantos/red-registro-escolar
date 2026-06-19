import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BookOpen, Clock, GraduationCap, Users } from "lucide-react";

const SHIFT_LABELS: Record<string, string> = {
  morning: "Matutino",
  afternoon: "Vespertino",
  evening: "Noturno",
  full_day: "Integral",
};

export default function StudentMyClass() {
  const { data: details, isLoading } = trpc.profiles.student.classDetails.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">Carregando turma...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
      </div>
    );
  }

  const cls = details.class as Record<string, unknown> | null;
  const { subjects, classmates } = details;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Users className="size-5" />
        Minha Turma
      </h2>

      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="py-5">
          <h3 className="text-xl font-bold text-foreground">
            {String(cls?.name ?? cls?.gradeLabel ?? "—")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap className="size-4" />
              {String(cls?.gradeLabel ?? "—")} ano
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {SHIFT_LABELS[String(cls?.shift ?? "")] ?? String(cls?.shift ?? "—")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {classmates.length} colegas
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Professores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {subjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada</p>
          )}
          {subjects.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
            >
              <span className="text-sm font-medium">{s.subjectName}</span>
              <span className="text-sm text-muted-foreground">{s.teacherName ?? "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Colegas de Turma ({classmates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classmates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum colega encontrado</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {classmates.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-sm font-bold text-white">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate text-sm font-medium">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
