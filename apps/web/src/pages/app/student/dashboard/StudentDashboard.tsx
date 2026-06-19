import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BookOpenCheck,
  ClipboardList,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

const MIN_ATTENDANCE = 80;

const EVENT_TYPE_META: Record<string, { icon: string; label: string }> = {
  prova: { icon: "📝", label: "Prova" },
  evento_escolar: { icon: "🎉", label: "Evento" },
  saida_antecipada: { icon: "🚪", label: "Saída" },
  feriado: { icon: "🏖️", label: "Feriado" },
  reuniao: { icon: "🤝", label: "Reunião" },
};

const FALLBACK_PLATFORMS = [
  { name: "Google Classroom", href: "https://classroom.google.com" },
  { name: "SISEDU", href: "https://sisedu.educacao.ba.gov.br" },
  { name: "SIC", href: "https://sic.educacao.ba.gov.br" },
  { name: "Enem na Rede", href: "https://enemnarede.mec.gov.br" },
  { name: "Conexão Educação", href: "https://conexaoeducacao.mec.gov.br" },
];

const attendanceChartConfig: ChartConfig = {
  pct: { label: "Frequência %", color: "#8b1120" },
};

const gradeChartConfig: ChartConfig = {
  count: { label: "Disciplinas", color: "#1f3a5f" },
};

const pieChartConfig: ChartConfig = {
  presencas: { label: "Presenças", color: "#16a34a" },
  justificadas: { label: "Justificadas", color: "#f59e0b" },
  faltas: { label: "Faltas", color: "#8b1120" },
};

function getPeDeMeiaStatus(pct: number) {
  if (pct >= 85) return "safe" as const;
  if (pct >= 80) return "warning" as const;
  return "blocked" as const;
}

function getStatusBadge(status: "safe" | "warning" | "blocked") {
  switch (status) {
    case "safe":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          Seguro
        </Badge>
      );
    case "warning":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-300">
          Atenção
        </Badge>
      );
    case "blocked":
      return (
        <Badge className="bg-red-brand/15 text-red-brand border-red-brand/40">
          BLOQUEADO
        </Badge>
      );
  }
}

function getAttendanceBarColor(pct: number) {
  if (pct >= 85) return "#16a34a";
  if (pct >= 80) return "#f59e0b";
  return "#8b1120";
}

export default function StudentDashboard() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const { data: attendance } = trpc.profiles.student.attendance.useQuery();
  const { data: classInfo } = trpc.profiles.student.classInfo.useQuery();
  const { data: grades } = trpc.profiles.student.grades.useQuery();
  const { data: events } = trpc.profiles.student.events.useQuery();
  const { data: nextExam } = trpc.profiles.student.nextExam.useQuery();
  const { data: platforms } = trpc.profiles.student.platforms.useQuery();
  const { data: notifications } = trpc.profiles.student.notifications.useQuery({
    unreadOnly: true,
    limit: 50,
  });

  const attendancePct = attendance?.pct ?? 100;
  const gpa = me?.averageGrade ?? 0;
  const gpaTrend = gpa >= 7 ? ("up" as const) : ("down" as const);
  const absencesLeft = attendance
    ? Math.max(0, Math.floor(0.2 * attendance.total) - attendance.absents)
    : 0;
  const unreadNotifs = (notifications ?? []).length;
  const peDeMeiaStatus = getPeDeMeiaStatus(attendancePct);

  const attendanceBySubject = (attendance?.bySubject ?? []).map(s => ({
    subject: s.subject.length > 5 ? s.subject.substring(0, 5) : s.subject,
    pct: s.pct,
    classes: s.classes,
    absences: s.absences,
  }));

  const attendanceSplit = attendance
    ? [
        { name: "Presenças", value: attendance.presents, fill: "#16a34a" },
        {
          name: "Faltas justificadas",
          value: attendance.justified,
          fill: "#f59e0b",
        },
        { name: "Faltas", value: attendance.absents, fill: "#8b1120" },
      ]
    : [];

  const gradeDistribution = (() => {
    if (!grades || grades.length === 0)
      return [
        { range: "0–4", count: 0 },
        { range: "4–6", count: 0 },
        { range: "6–7", count: 0 },
        { range: "7–8", count: 0 },
        { range: "8–10", count: 0 },
      ];
    const bins = [0, 0, 0, 0, 0];
    for (const g of grades) {
      const v = g.grade;
      if (v < 4) bins[0]++;
      else if (v < 6) bins[1]++;
      else if (v < 7) bins[2]++;
      else if (v < 8) bins[3]++;
      else bins[4]++;
    }
    return [
      { range: "0–4", count: bins[0] },
      { range: "4–6", count: bins[1] },
      { range: "6–7", count: bins[2] },
      { range: "7–8", count: bins[3] },
      { range: "8–10", count: bins[4] },
    ];
  })();

  const nextExamDisplay = nextExam
    ? {
        subject: nextExam.subject,
        date: new Date(nextExam.date + "T00:00:00").toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
          }
        ),
      }
    : null;

  const firstName = me?.name?.split(" ")[0] ?? "Aluno";

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="font-display text-2xl text-foreground">
          Olá, {firstName} 👋
        </h1>
        <p className="font-body text-sm text-muted-foreground">
          {classInfo
            ? `${me?.grade ?? ""} · ${classInfo.course ?? ""}`
            : me?.grade
              ? `${me.grade} · ${me.school ?? ""}`
              : "Carregando..."}
        </p>
      </div>

      {/* Alerta Pé de Meia */}
      {peDeMeiaStatus === "blocked" ? (
        <Alert className="bg-red-brand/10 border-red-brand">
          <span className="text-lg">🚨</span>
          <AlertTitle className="font-heading font-semibold text-red-brand">
            Pé de Meia BLOQUEADO
          </AlertTitle>
          <AlertDescription className="font-body text-sm text-red-brand/80">
            Sua frequência está em {attendancePct}%, abaixo do mínimo de{" "}
            {MIN_ATTENDANCE}%. O benefício está bloqueado até que a frequência
            suba.
          </AlertDescription>
        </Alert>
      ) : peDeMeiaStatus === "warning" ? (
        <Alert className="bg-amber-50 border-amber-300">
          <span className="text-lg">⚠️</span>
          <AlertTitle className="font-heading font-semibold text-amber-700">
            Atenção — Pé de Meia em risco
          </AlertTitle>
          <AlertDescription className="font-body text-sm text-amber-700/80">
            Sua frequência está em {attendancePct}%. O mínimo para não bloquear
            é {MIN_ATTENDANCE}%. Você pode faltar mais {absencesLeft} vezes
            neste período.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Cards de métricas rápidas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {/* Frequência */}
        <Card
          className={
            attendancePct < MIN_ATTENDANCE
              ? "border-red-brand/40"
              : attendancePct < 85
                ? "border-amber-300"
                : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
              Frequência
            </CardTitle>
            <ClipboardList
              className={`size-4 ${
                attendancePct >= MIN_ATTENDANCE
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              className={`font-condensed text-3xl font-bold ${
                attendancePct >= 80 ? "text-green-600" : "text-red-brand"
              }`}
            >
              {attendancePct}%
            </div>
            <Progress
              value={attendancePct}
              className={`h-2 ${
                attendancePct >= 85
                  ? "[&>[data-slot=progress-indicator]]:bg-green-500"
                  : attendancePct >= 80
                    ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                    : "[&>[data-slot=progress-indicator]]:bg-red-brand"
              }`}
            />
          </CardContent>
        </Card>

        {/* Média Geral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
              Média Geral
            </CardTitle>
            <BookOpenCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-end gap-1.5">
            <span className="font-condensed text-3xl font-bold text-foreground">
              {gpa > 0 ? gpa.toFixed(1) : "—"}
            </span>
            {gpa > 0 &&
              (gpaTrend === "up" ? (
                <TrendingUp className="size-4 text-green-500 mb-1" />
              ) : (
                <TrendingDown className="size-4 text-red-500 mb-1" />
              ))}
          </CardContent>
        </Card>

        {/*
        Próxima Prova
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
              Próxima Prova
            </CardTitle>
            <Calendar className="size-4 text-red-brand" />
          </CardHeader>
          <CardContent>
            {nextExamDisplay ? (
              <>
                <p className="font-condensed text-lg font-bold text-foreground">
                  {nextExamDisplay.subject}
                </p>
                <p className="font-body text-xs text-red-brand font-medium">
                  {nextExamDisplay.date}
                </p>
              </>
            ) : (
              <p className="font-body text-sm text-muted-foreground">
                Nenhuma agendada
              </p>
            )}
          </CardContent>
        </Card> */}

        {/* Avisos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
              Avisos
            </CardTitle>
            <div className="relative">
              <Bell className="size-4 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-red-brand text-[9px] font-bold text-white">
                  {unreadNotifs}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-condensed text-3xl font-bold text-foreground">
              {unreadNotifs}
            </span>
            <span className="font-body text-xs text-muted-foreground ml-1.5">
              não lidos
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Pé de Meia (bloco expandido) */}
      <Card
        className={`${
          peDeMeiaStatus === "safe"
            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
            : peDeMeiaStatus === "warning"
              ? "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700"
              : "bg-red-brand/10 border-red-brand dark:bg-red-brand/5 dark:border-red-brand"
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <span className="text-lg">💰</span> Pé de Meia
            </CardTitle>
            {getStatusBadge(peDeMeiaStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-condensed text-3xl font-bold">
                {attendancePct}%
              </span>
              <span className="font-body text-sm text-muted-foreground ml-2">
                Meta: ≥ {MIN_ATTENDANCE}%
              </span>
            </div>
          </div>
          <Progress
            value={attendancePct}
            className={`h-3 ${
              peDeMeiaStatus === "safe"
                ? "[&>[data-slot=progress-indicator]]:bg-green-500"
                : peDeMeiaStatus === "warning"
                  ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                  : "[&>[data-slot=progress-indicator]]:bg-red-brand"
            }`}
          />
          {peDeMeiaStatus === "safe" && (
            <p className="font-body text-sm text-green-700">
              ✅ EM DIA — Seu Pé de Meia está seguro.
            </p>
          )}
          {peDeMeiaStatus === "warning" && (
            <p className="font-body text-sm text-amber-700">
              ⚠️ Você pode faltar mais{" "}
              <span className="font-condensed font-bold">
                {absencesLeft} vezes
              </span>{" "}
              este bimestre sem prejudicar seu Pé de Meia.
            </p>
          )}
          {peDeMeiaStatus === "blocked" && (
            <p className="font-body text-sm text-red-brand">
              🚫 Pé de Meia BLOQUEADO — frequência abaixo do mínimo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        {attendanceBySubject.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm font-semibold">
                Frequência por Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={attendanceChartConfig}
                className="h-[220px] w-full"
              >
                <BarChart
                  data={attendanceBySubject}
                  margin={{ top: 4, right: 4, bottom: 4, left: -16 }}
                >
                  <XAxis
                    dataKey="subject"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {attendanceBySubject.map((entry, idx) => (
                      <Cell key={idx} fill={getAttendanceBarColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground font-body">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-brand" />
                Abaixo de 80%
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 ml-2" />
                80–84%
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 ml-2" />
                Acima de 85%
              </div>
            </CardContent>
          </Card>
        )}

        {attendanceSplit.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm font-semibold">
                Resumo de Presenças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={pieChartConfig}
                className="h-[220px] w-full"
              >
                <PieChart>
                  <Pie
                    data={attendanceSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {attendanceSplit.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                </PieChart>
              </ChartContainer>
              <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-body">
                {attendanceSplit.map(item => (
                  <span key={item.name} className="flex items-center gap-1">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Distribuição de notas
      {grades && grades.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-sm font-semibold">
              Distribuição de Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={gradeChartConfig}
              className="h-[160px] w-full"
            >
              <BarChart
                data={gradeDistribution}
                margin={{ top: 4, right: 4, bottom: 4, left: -16 }}
              >
                <XAxis
                  dataKey="range"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {gradeDistribution.map((entry, idx) => {
                    const fill =
                      entry.range === "8–10"
                        ? "#16a34a"
                        : entry.range === "0–4"
                          ? "#8b1120"
                          : "#1f3a5f";
                    return <Cell key={idx} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )} */}

      {/* Próximos Eventos */}
      {(events ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Próximos Eventos
            </h2>
            <button className="font-body text-xs text-red-brand hover:text-red-brand-dark transition-colors">
              Ver calendário completo →
            </button>
          </div>
          <div className="space-y-2">
            {(events ?? []).map(evt => {
              const meta = EVENT_TYPE_META[evt.eventType] ?? {
                icon: "📅",
                label: "Evento",
              };
              return (
                <div
                  key={evt.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                >
                  <span className="text-lg shrink-0">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-foreground truncate">
                      {evt.title}
                    </p>
                  </div>
                  <span className="font-condensed text-xs text-muted-foreground shrink-0">
                    {new Date(evt.eventDate + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                      { day: "2-digit", month: "2-digit" }
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
