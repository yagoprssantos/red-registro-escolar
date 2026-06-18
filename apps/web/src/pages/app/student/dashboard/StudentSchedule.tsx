import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Clock } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const DEFAULT_HOURS = [
  "07:00–07:45",
  "07:45–08:30",
  "08:30–09:15",
  "09:30–10:15",
  "10:15–11:00",
  "11:00–11:45",
];

const SHIFT_MAP: Record<string, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  full_day: "full_day",
};

export default function StudentSchedule() {
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
  const enroll = ((enrollments ?? []) as RegistryRow[])[0];
  const classId = enroll?.classId as number | undefined;

  const { data: classes } = trpc.registry.list.useQuery({
    entity: "classes" as const,
    limit: 200,
  });
  const cls = classId
    ? ((classes ?? []) as RegistryRow[]).find(c => c.id === classId)
    : null;
  const shift = SHIFT_MAP[String(cls?.shift ?? "morning")] ?? "morning";

  const { data: slots } = trpc.profiles.student.scheduleSlots.useQuery(
    { shift },
    { enabled: !!student }
  );

  const HOURS = (slots ?? []).length > 0
    ? (slots ?? []).map(s => `${s.startTime}–${s.endTime}`)
    : DEFAULT_HOURS;

  const { data: subjects } = trpc.registry.list.useQuery(
    {
      entity: "classSubjects" as const,
      filters: classId ? { classId } : {},
      limit: 30,
    },
    { enabled: !!classId }
  );
  const { data: allSubjectDefs } = trpc.registry.list.useQuery({
    entity: "subjects" as const,
    limit: 100,
  });
  const { data: sessions } = trpc.registry.list.useQuery(
    {
      entity: "classSessions" as const,
      filters: classId ? { classId } : {},
      limit: 200,
    },
    { enabled: !!classId }
  );
  const { data: allTeachers } = trpc.registry.list.useQuery({
    entity: "teachers" as const,
    limit: 100,
  });
  const { data: classTeachersRaw } = trpc.registry.list.useQuery({
    entity: "classTeachers" as const,
    limit: 100,
  });

  const subjectList = (subjects ?? []) as RegistryRow[];
  const sessionList = (sessions ?? []) as RegistryRow[];
  const teacherList = (allTeachers ?? []) as RegistryRow[];
  const ctList = (classTeachersRaw ?? []) as RegistryRow[];
  const subDefs = (allSubjectDefs ?? []) as RegistryRow[];

  const scheduleByDay: Record<
    string,
    { time: string; subject: string; teacher: string }[]
  > = {};
  for (const day of DAYS) scheduleByDay[day] = [];

  for (const session of sessionList) {
    const date = String(session.lessonDate ?? "");
    if (!date) continue;
    const d = new Date(date);
    const dayIdx = d.getDay();
    if (dayIdx < 1 || dayIdx > 5) continue;
    const dayName = DAYS[dayIdx - 1];

    const cs = subjectList.find(
      s => s.id === (session as RegistryRow).classSubjectId
    );
    const subjectDef = cs ? subDefs.find(s => s.id === cs.subjectId) : null;
    const ct = cs ? ctList.find(t => t.classSubjectId === cs.id) : null;
    const teacher = ct ? teacherList.find(t => t.id === ct.teacherId) : null;

    const slotIdx = ((session.lessonNumber as number) ?? 1) - 1;
    scheduleByDay[dayName].push({
      time: HOURS[slotIdx] ?? `${session.lessonNumber}ª aula`,
      subject: String(subjectDef?.name ?? "Disciplina"),
      teacher: String(teacher?.name ?? "—"),
    });
  }

  const hasSchedule = Object.values(scheduleByDay).some(arr => arr.length > 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="size-5" />
        Horário de Aulas
      </h2>

      {!hasSchedule && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Clock className="mx-auto size-10 opacity-30 mb-3" />
            <p className="text-sm">Nenhum horário cadastrado ainda.</p>
            <p className="text-xs mt-1">
              A escola ainda não definiu a grade de horários.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-6 gap-1 mb-2">
            <div className="p-2 text-xs font-semibold text-muted-foreground">
              Horário
            </div>
            {DAYS.map(day => (
              <div
                key={day}
                className="p-2 text-xs font-semibold text-center text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {HOURS.map((hour, idx) => (
            <div key={hour} className="grid grid-cols-6 gap-1 mb-1">
              <div className="flex items-start p-2 text-[11px] text-muted-foreground font-mono">
                {hour}
              </div>
              {DAYS.map(day => {
                const entry = scheduleByDay[day]?.find(e => e.time === hour);
                if (!entry)
                  return (
                    <div
                      key={day}
                      className="rounded-lg bg-muted/20 p-2 min-h-[52px]"
                    />
                  );

                return (
                  <div
                    key={day}
                    className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 min-h-[52px] dark:bg-emerald-950/20 dark:border-emerald-800"
                  >
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
                      {entry.subject}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {entry.teacher}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
