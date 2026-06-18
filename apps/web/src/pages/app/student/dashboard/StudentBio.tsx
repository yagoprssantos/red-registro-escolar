import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  GraduationCap,
  Hash,
  Heart,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function StudentBio() {
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

  const { data: classes } = trpc.registry.list.useQuery({
    entity: "classes" as const,
    limit: 200,
  });
  const cls = enrollment
    ? ((classes ?? []) as RegistryRow[]).find(c => c.id === enrollment.classId)
    : null;

  const { data: guardians } = trpc.registry.list.useQuery(
    {
      entity: "studentGuardians" as const,
      filters: { studentId: student?.id },
      limit: 10,
    },
    { enabled: !!student?.id }
  );
  const { data: guardianList } = trpc.registry.list.useQuery({
    entity: "guardians" as const,
    limit: 100,
  });
  const { data: attendanceRecords } = trpc.registry.list.useQuery(
    { entity: "attendanceRecords" as const, limit: 2000 },
    { enabled: !!student?.id }
  );

  const linkedGuardians = (guardians ?? []) as RegistryRow[];
  const gList = (guardianList ?? []) as RegistryRow[];
  const guardianDetails = linkedGuardians
    .map(lg => gList.find(g => g.id === lg.guardianId))
    .filter(Boolean) as RegistryRow[];

  const myRecords = (attendanceRecords ?? []) as RegistryRow[];
  const studentRecords = myRecords.filter(r => r.studentId === student?.id);
  const totalRecords = studentRecords.length;
  const absences = studentRecords.filter(r => r.status === "absent").length;
  const justified = studentRecords.filter(r => r.status === "justified").length;
  const attendancePct =
    totalRecords > 0
      ? Math.round(((totalRecords - absences) / totalRecords) * 100)
      : 100;

  const fields = [
    { icon: User, label: "Nome Completo", value: String(student?.name ?? "—") },
    {
      icon: Hash,
      label: "Matrícula",
      value: String(student?.enrollmentNumber ?? "—"),
      mono: true,
    },
    {
      icon: Calendar,
      label: "Data de Nascimento",
      value: student?.dateOfBirth
        ? new Date(String(student.dateOfBirth)).toLocaleDateString("pt-BR")
        : "—",
    },
    { icon: Mail, label: "E-mail", value: String(student?.email ?? "—") },
    { icon: Phone, label: "Telefone", value: String(student?.phone ?? "—") },
    {
      icon: GraduationCap,
      label: "Série / Ano",
      value: `${String(student?.grade ?? "—")} ano`,
    },
    {
      icon: ShieldCheck,
      label: "Status",
      value: String(student?.status ?? "—"),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Heart className="size-5" />
        Ficha Biográfica
      </h2>

      {/* Student header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:items-start">
          <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-3xl font-bold text-white shadow-lg">
            {student?.name ? String(student.name).charAt(0).toUpperCase() : "?"}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold">
              {String(student?.name ?? "—")}
            </h3>
            <p className="text-sm text-muted-foreground">
              Matrícula{" "}
              <span className="font-mono font-medium">
                {String(student?.enrollmentNumber ?? "—")}
              </span>
              {cls && (
                <>
                  {" "}
                  — Turma{" "}
                  <span className="font-medium">
                    {String(cls.name ?? cls.gradeLabel ?? "")}
                  </span>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3">
                <Icon className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p
                    className={`text-sm font-medium ${f.mono ? "font-mono" : ""}`}
                  >
                    {f.value}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Guardians */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsáveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {guardianDetails.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum responsável vinculado
            </p>
          )}
          {guardianDetails.map(g => (
            <div
              key={String(g.id)}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{String(g.name)}</p>
                <p className="text-xs text-muted-foreground">
                  {String(g.relationship ?? "Responsável")}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {String(g.phone ?? g.email ?? "")}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Academic summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Acadêmico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalRecords}</p>
              <p className="text-xs text-muted-foreground">Total aulas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{absences}</p>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{justified}</p>
              <p className="text-xs text-muted-foreground">Justificadas</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${attendancePct >= 80 ? "text-green-600" : "text-red-600"}`}
              >
                {attendancePct}%
              </p>
              <p className="text-xs text-muted-foreground">Frequência</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
