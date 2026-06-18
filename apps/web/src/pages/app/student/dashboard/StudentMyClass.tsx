import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BookOpen, Clock, GraduationCap, Users } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

const SHIFT_LABELS: Record<string, string> = {
  morning: "Matutino",
  afternoon: "Vespertino",
  evening: "Noturno",
  full_day: "Integral",
};

export default function StudentMyClass() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const student = me as RegistryRow | null | undefined;

  const { data: enrollments } = trpc.registry.list.useQuery(
    {
      entity: "classEnrollments" as const,
      filters: { studentId: student?.id, status: "ativo" },
      limit: 10,
    },
    { enabled: !!student?.id }
  );
  const enrollment = ((enrollments ?? []) as RegistryRow[])[0];
  const classId = enrollment?.classId as number | undefined;

  const { data: classInfo } = trpc.registry.list.useQuery(
    {
      entity: "classes" as const,
      filters: classId ? { id: classId } : {},
      limit: 1,
    },
    { enabled: !!classId }
  );
  const cls = ((classInfo ?? []) as RegistryRow[])[0];

  const { data: allEnrollments } = trpc.registry.list.useQuery(
    {
      entity: "classEnrollments" as const,
      filters: classId ? { classId, status: "ativo" } : {},
      limit: 60,
    },
    { enabled: !!classId }
  );
  const classmates = (allEnrollments ?? []) as RegistryRow[];

  const { data: allStudents } = trpc.registry.list.useQuery(
    { entity: "students" as const, limit: 200 },
    { enabled: !!classId }
  );

  const { data: subjects } = trpc.registry.list.useQuery(
    {
      entity: "classSubjects" as const,
      filters: classId ? { classId } : {},
      limit: 20,
    },
    { enabled: !!classId }
  );
  const subjectList = (subjects ?? []) as RegistryRow[];

  const { data: allSubjectDefs } = trpc.registry.list.useQuery({
    entity: "subjects" as const,
    limit: 100,
  });

  const { data: classTeachers } = trpc.registry.list.useQuery(
    { entity: "classTeachers" as const, limit: 100 },
    { enabled: !!classId }
  );
  const { data: allTeachers } = trpc.registry.list.useQuery({
    entity: "teachers" as const,
    limit: 100,
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Users className="size-5" />
        Minha Turma
      </h2>

      {/* Class Info Card */}
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
              {SHIFT_LABELS[String(cls?.shift ?? "")] ??
                String(cls?.shift ?? "—")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {classmates.length} alunos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Teachers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4" />
            Professores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {subjectList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma disciplina cadastrada
            </p>
          )}
          {subjectList.map(cs => {
            const subjectDef = (allSubjectDefs ?? []) as RegistryRow[];
            const subject = subjectDef.find(s => s.id === cs.subjectId);
            const teacherAssignment = (
              (classTeachers ?? []) as RegistryRow[]
            ).find(ct => ct.classSubjectId === cs.id);
            const teacher = teacherAssignment
              ? ((allTeachers ?? []) as RegistryRow[]).find(
                  t => t.id === teacherAssignment.teacherId
                )
              : null;

            return (
              <div
                key={String(cs.id)}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
              >
                <span className="text-sm font-medium">
                  {String(subject?.name ?? "Disciplina")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {teacher ? String(teacher.name) : "—"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Classmates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Colegas de Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {classmates.map(enr => {
              const studentData = ((allStudents ?? []) as RegistryRow[]).find(
                s => s.id === enr.studentId && s.id !== student?.id
              );
              if (!studentData) return null;
              return (
                <div
                  key={String(enr.id)}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-sm font-bold text-white">
                    {String(studentData.name).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {String(studentData.name)}
                  </span>
                </div>
              );
            })}
          </div>
          {classmates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum colega encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
