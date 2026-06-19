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

const PE_DE_MEIA_THRESHOLD = 80;

export default function StudentAttendance() {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");

  const { data: stats, isLoading: loadingStats } = trpc.profiles.student.attendance.useQuery();
  const { data: records, isLoading: loadingRecords } = trpc.profiles.student.attendanceDetail.useQuery();

  if (loadingStats || loadingRecords) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">Carregando frequência...</p>
      </div>
    );
  }

  const enriched = (records ?? []).map(r => ({
    id: r.id,
    status: r.status,
    date: r.date ?? "",
    subject: r.subject ?? "—",
    subjectId: r.subjectId,
  }));

  const total = stats?.total ?? enriched.length;
  const presents = stats?.presents ?? enriched.filter(r => r.status === "present").length;
  const absents = stats?.absents ?? enriched.filter(r => r.status === "absent").length;
  const justified = stats?.justified ?? enriched.filter(r => r.status === "justified").length;
  const pct = stats?.pct ?? (total > 0 ? Math.round((presents / total) * 100) : 100);

  const peDeMeiaOk = pct >= PE_DE_MEIA_THRESHOLD;
  const maxAbsencesAllowed = Math.floor(0.2 * total);
  const absencesRemaining = Math.max(0, maxAbsencesAllowed - absents);

  const sortedEnriched = [...enriched].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  for (const r of sortedEnriched) {
    if (r.status === "absent") currentStreak++;
    else currentStreak = 0;
  }

  let filtered = enriched;
  if (subjectFilter !== "all")
    filtered = filtered.filter(r => String(r.subjectId) === subjectFilter);
  if (monthFilter)
    filtered = filtered.filter(r => r.date.startsWith(monthFilter));
  filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const uniqueSubjects = Array.from(
    new Map(enriched.map(r => [r.subjectId, r.subject])).entries()
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ClipboardList className="size-5" />
        Frequência
      </h2>

      <Card className={`border-l-4 ${peDeMeiaOk ? "border-l-green-500" : "border-l-red-500"}`}>
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
                <p className="text-xs text-muted-foreground">Programa de poupança do ensino médio</p>
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
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Frequência: {pct}%</span>
              <span>Mínimo: {PE_DE_MEIA_THRESHOLD}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${peDeMeiaOk ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
          {!peDeMeiaOk && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
              <ShieldAlert className="mt-0.5 size-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Seu Pé de Meia está bloqueado!
                </p>
                <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
                  Frequência abaixo de 80%. Você precisa atingir {PE_DE_MEIA_THRESHOLD}% para receber o benefício.
                </p>
              </div>
            </div>
          )}
          {peDeMeiaOk && absencesRemaining <= 3 && absencesRemaining > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertTriangle className="mt-0.5 size-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Atenção: {absencesRemaining} {absencesRemaining === 1 ? "falta" : "faltas"} restante{absencesRemaining === 1 ? "" : "s"} para perder o Pé de Meia
                </p>
                <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
                  Cada falta a mais pode bloquear o benefício. Mantenha a frequência!
                </p>
              </div>
            </div>
          )}
          {currentStreak >= 2 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20">
              <AlertTriangle className="mt-0.5 size-5 flex-shrink-0 text-orange-600" />
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                {currentStreak} faltas consecutivas — cuidado para não perder o Pé de Meia!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <p className={`text-2xl font-bold ${pct >= PE_DE_MEIA_THRESHOLD ? "text-green-600" : "text-red-600"}`}>
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

      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado
          </p>
        )}
        {filtered.map((r, i) => {
          const statusIcon =
            r.status === "present" ? "✅" : r.status === "justified" ? "📋" : "❌";
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-base">{statusIcon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.date
                      ? new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
