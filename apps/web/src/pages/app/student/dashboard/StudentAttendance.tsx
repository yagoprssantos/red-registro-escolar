import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useState } from "react";
import type { RegistryRow } from "../../../shared/DashboardShell";

const PE_DE_MEIA_THRESHOLD = 80;

export default function StudentAttendance() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const student = me as RegistryRow | null | undefined;

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");

  const { data: records } = trpc.registry.list.useQuery(
    { entity: "attendanceRecords" as const, limit: 2000 },
    { enabled: !!student }
  );
  const { data: sessions } = trpc.registry.list.useQuery({
    entity: "classSessions" as const,
    limit: 2000,
  });
  const { data: classSubjects } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: 200,
  });
  const { data: subjectDefs } = trpc.registry.list.useQuery({
    entity: "subjects" as const,
    limit: 100,
  });

  const allRecords = (records ?? []) as RegistryRow[];
  const allSessions = (sessions ?? []) as RegistryRow[];
  const csList = (classSubjects ?? []) as RegistryRow[];
  const subDefs = (subjectDefs ?? []) as RegistryRow[];

  const myRecords = allRecords.filter(r => r.studentId === student?.id);

  const enriched = myRecords.map(r => {
    const session = allSessions.find(s => s.id === r.classSessionId);
    const cs = session
      ? csList.find(c => c.id === session.classSubjectId)
      : null;
    const subject = cs ? subDefs.find(s => s.id === cs.subjectId) : null;
    return {
      ...r,
      date: session?.lessonDate ? String(session.lessonDate) : "",
      subject: subject ? String(subject.name) : "—",
      subjectId: cs?.subjectId,
    };
  });

  const total = enriched.length;
  const presents = enriched.filter(r => r.status === "present").length;
  const absents = enriched.filter(r => r.status === "absent").length;
  const justified = enriched.filter(r => r.status === "justified").length;
  const pct = total > 0 ? Math.round((presents / total) * 100) : 100;

  const peDeMeiaOk = pct >= PE_DE_MEIA_THRESHOLD;
  const maxAbsencesAllowed = Math.floor(0.2 * total);
  const absencesRemaining = Math.max(0, maxAbsencesAllowed - absents);

  // Consecutive absences
  const sortedEnriched = [...enriched].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  let currentStreak = 0;
  let maxConsecutive = 0;
  for (const r of sortedEnriched) {
    if (r.status === "absent") {
      currentStreak++;
      maxConsecutive = Math.max(maxConsecutive, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Apply filters
  let filtered = enriched;
  if (subjectFilter !== "all")
    filtered = filtered.filter(r => String(r.subjectId) === subjectFilter);
  if (monthFilter)
    filtered = filtered.filter(r => r.date.startsWith(monthFilter));
  filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const uniqueSubjects = [
    ...new Map(enriched.map(r => [r.subjectId, r.subject])).entries(),
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ClipboardList className="size-5" />
        Frequência
      </h2>

      {/* Pé de Meia Card */}
      <Card
        className={`border-l-4 ${peDeMeiaOk ? "border-l-green-500" : "border-l-red-500"}`}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {peDeMeiaOk ? (
                <ShieldCheck className="size-8 text-green-600 dark:text-green-400" />
              ) : (
                <ShieldX className="size-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h3 className="text-sm font-semibold">Pé de Meia</h3>
                <p className="text-xs text-muted-foreground">
                  Programa de poupança do ensino médio
                </p>
              </div>
            </div>
            <div className="text-right">
              {peDeMeiaOk ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✅ Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  🚫 Bloqueado
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Frequência: {pct}%</span>
              <span>Mínimo: {PE_DE_MEIA_THRESHOLD}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${peDeMeiaOk ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>

          {!peDeMeiaOk && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/20 dark:border-red-800">
              <ShieldAlert className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Seu Pé de Meia está bloqueado!
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                  Frequência abaixo de 80%. Você precisa atingir{" "}
                  {PE_DE_MEIA_THRESHOLD}% para receber o benefício.
                </p>
              </div>
            </div>
          )}
          {peDeMeiaOk && absencesRemaining <= 3 && absencesRemaining > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Atenção: {absencesRemaining}{" "}
                  {absencesRemaining === 1 ? "falta" : "faltas"} restante
                  {absencesRemaining === 1 ? "" : "s"} para perder o Pé de Meia
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                  Cada falta a mais pode bloquear o benefício. Mantenha a
                  frequência!
                </p>
              </div>
            </div>
          )}
          {currentStreak >= 2 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 dark:bg-orange-950/20 dark:border-orange-800">
              <AlertTriangle className="size-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                {currentStreak} faltas consecutivas — cuidado para não perder o
                Pé de Meia!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{presents}</p>
            <p className="text-xs text-muted-foreground">Presentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{absents}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p
              className={`text-2xl font-bold ${pct >= PE_DE_MEIA_THRESHOLD ? "text-green-600" : "text-red-600"}`}
            >
              {pct}%
            </p>
            <p className="text-xs text-muted-foreground">Frequência</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{justified}</p>
            <p className="text-xs text-muted-foreground">Justificadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="rounded-lg border bg-card px-3 py-2 text-sm"
          aria-label="Filtrar por disciplina"
        >
          <option value="all">Todas as disciplinas</option>
          {uniqueSubjects.map(([id, name]) => (
            <option key={String(id)} value={String(id)}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="rounded-lg border bg-card px-3 py-2 text-sm"
          aria-label="Filtrar por mês"
        />
      </div>

      {/* Records */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum registro encontrado
          </p>
        )}
        {filtered.map((r, i) => {
          const statusIcon =
            r.status === "present"
              ? "✅"
              : r.status === "justified"
                ? "📋"
                : "❌";
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base">{statusIcon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.date
                      ? new Date(r.date + "T00:00:00").toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  r.status === "present"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : r.status === "justified"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {r.status === "present"
                  ? "Presente"
                  : r.status === "justified"
                    ? "Justificada"
                    : "Falta"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
