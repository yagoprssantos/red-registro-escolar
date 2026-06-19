import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { AlertTriangle, Download, GraduationCap, Search } from "lucide-react";
import { useState } from "react";

function formatClassName(cls: RegistryRow): string {
  if (cls.displayName) return String(cls.displayName);
  const grade = String(cls.gradeLabel || "").trim();
  const course = String(cls.course || "").trim();
  const name = String(cls.name || "").trim();
  const gradeNum = parseInt(grade, 10);
  const gradeStr =
    !isNaN(gradeNum) && gradeNum > 0 && String(gradeNum) === grade
      ? `${gradeNum}º Ano`
      : grade;
  if (gradeStr && course) return `${gradeStr} — ${course}`;
  if (gradeStr && name && gradeStr.toLowerCase() !== name.toLowerCase())
    return `${gradeStr} — ${name}`;
  if (gradeStr) return gradeStr;
  return name || `Turma ${cls.id}`;
}

type ReportTab = "frequency" | "performance" | "comments";

const TABS: { value: ReportTab; label: string }[] = [
  { value: "frequency", label: "📊 Frequência" },
  { value: "performance", label: "📈 Desempenho" },
  { value: "comments", label: "💬 Comentários" },
];

export default function SchoolReports() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const [tab, setTab] = useState<ReportTab>("frequency");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: attendanceReport } = trpc.school.attendanceReport.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );
  const { data: gradesReport } = trpc.school.gradesReport.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );
  const { data: classes } = trpc.registry.list.useQuery(
    {
      entity: "classes" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 200,
    },
    { enabled: !!schoolId }
  );

  // For comments report — fetch all comments
  const { data: comments } = trpc.registry.list.useQuery(
    { entity: "studentComments" as const, limit: 1000 },
    { enabled: !!schoolId && tab === "comments" }
  );

  const classList = (classes ?? []) as RegistryRow[];
  const commentList = (comments ?? []) as RegistryRow[];

  function exportCSV(data: RegistryRow[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(";"),
      ...data.map(row =>
        headers
          .map(h => {
            const val = String(row[h] ?? "");
            return val.includes(";") || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const attendanceRecords = (
    (attendanceReport?.records ?? []) as RegistryRow[]
  ).filter(r => {
    if (classFilter !== "all" && String(r.classId) !== classFilter)
      return false;
    if (
      search &&
      !String(r.studentName || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const gradeRecords = ((gradesReport?.scores ?? []) as RegistryRow[]).filter(
    r => {
      if (classFilter !== "all" && String(r.classId) !== classFilter)
        return false;
      if (
        search &&
        !String(r.studentName || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      return true;
    }
  );

  const filteredComments = commentList.filter(c => {
    if (classFilter !== "all" && String(c.classId) !== classFilter)
      return false;
    if (
      search &&
      !String(c.content || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // Stats
  const atRisk = attendanceRecords.filter(r => {
    const rate = Number(r.absenceRate || r.absence_rate || 0);
    return rate > 25;
  });

  const belowAvg = gradeRecords.filter(r => {
    const score = Number(r.score || 0);
    return score < 5;
  });

  const averageAttendance =
    attendanceRecords.length > 0
      ? (
          attendanceRecords.reduce((acc, r) => {
            const rate = Number(r.attendanceRate ?? r.presenceRate ?? 0);
            return acc + rate;
          }, 0) / attendanceRecords.length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Relatórios</h2>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todas as turmas</option>
          {classList.map(cls => (
            <option key={String(cls.id)} value={String(cls.id)}>
              {formatClassName(cls)}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency tab */}
      {tab === "frequency" && (
        <div className="space-y-4">
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendanceRecords.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Presença média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {averageAttendance ?? "—"}%{" "}
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-500" />
                  Alunos em risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {atRisk.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* At-risk students */}
          {atRisk.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-red-600">
                Alunos com ausência {">"} 25%
              </h3>
              <div className="space-y-1">
                {atRisk.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-red-50/50 px-3 py-2 text-sm dark:bg-red-950/10"
                  >
                    <span>{String(r.studentName || "Aluno")}</span>
                    <span className="font-bold text-red-500">
                      {String(r.absenceRate || r.absence_rate)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                exportCSV(attendanceRecords, "relatorio-frequencia")
              }
              disabled={attendanceRecords.length === 0}
            >
              <Download className="mr-1 size-4" /> Exportar CSV
            </Button>
          </div>
        </div>
      )}

      {/* Performance tab */}
      {tab === "performance" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Notas lançadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gradeRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Média geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gradesReport?.averageScore ?? "—"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Abaixo da média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {belowAvg.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {belowAvg.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-amber-600 flex items-center gap-2">
                <GraduationCap className="size-4" />
                Alunos abaixo da média (nota {"<"} 5)
              </h3>
              <div className="space-y-1">
                {belowAvg.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-amber-50/50 px-3 py-2 text-sm dark:bg-amber-950/10"
                  >
                    <span>{String(r.studentName || "Aluno")}</span>
                    <span className="font-bold text-amber-600">
                      {String(r.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportCSV(gradeRecords, "relatorio-desempenho")}
              disabled={gradeRecords.length === 0}
            >
              <Download className="mr-1 size-4" /> Exportar CSV
            </Button>
          </div>
        </div>
      )}

      {/* Comments tab */}
      {tab === "comments" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredComments.length} comentário
                  {filteredComments.length !== 1 ? "s" : ""} (inclui
                  school_only)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportCSV(filteredComments, "relatorio-comentarios")
                  }
                  disabled={filteredComments.length === 0}
                >
                  <Download className="mr-1 size-4" /> Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {filteredComments.map(c => {
              const cat = String(c.category);
              return (
                <div
                  key={String(c.id)}
                  className="rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">
                      {cat === "praise" || cat === "elogio"
                        ? "⭐"
                        : cat === "improvement" || cat === "melhoria"
                          ? "🔄"
                          : cat === "ocorrencia"
                            ? "⚠️"
                            : "💬"}
                    </span>
                    <span className="text-xs font-medium capitalize text-muted-foreground">
                      {cat}
                    </span>
                    {c.authorName && (
                      <span className="text-xs font-semibold text-foreground">
                        Prof. {String(c.authorName)}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {String(c.visibility)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {c.createdAt
                        ? new Date(String(c.createdAt)).toLocaleDateString(
                            "pt-BR"
                          )
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground line-clamp-2">
                    {String(c.content || c.text || "")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
