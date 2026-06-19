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

export default function StudentBio() {
  const { data: me, isLoading: loadingMe } =
    trpc.profiles.student.me.useQuery();
  const { data: classInfo, isLoading: loadingClass } =
    trpc.profiles.student.classInfo.useQuery();
  const { data: guardians, isLoading: loadingGuardians } =
    trpc.profiles.student.guardians.useQuery();
  const { data: attendance, isLoading: loadingAttendance } =
    trpc.profiles.student.attendance.useQuery();

  if (loadingMe || loadingClass || loadingGuardians || loadingAttendance) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">
          Carregando ficha...
        </p>
      </div>
    );
  }

  const student = me as Record<string, unknown> | null | undefined;
  const cls = classInfo as Record<string, unknown> | null | undefined;
  const guardianList = (guardians ?? []) as Array<{
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    relationship: string | null;
  }>;

  const totalRecords = attendance?.total ?? 0;
  const absences = attendance?.absents ?? 0;
  const justified = attendance?.justified ?? 0;
  const attendancePct = attendance?.pct ?? 100;

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
      value: `${String(student?.grade ?? "—")}`,
    },
    {
      icon: ShieldCheck,
      label: "Status",
      value: String(student?.status ?? "ativo"),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Heart className="size-5" />
        Ficha Biográfica
      </h2>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:items-start">
          <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-3xl font-bold text-white shadow-lg">
            {student?.name ? String(student.name).charAt(0).toUpperCase() : "?"}
          </div>
          <div className="flex-1 text-center sm:text-left">
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
                    {String(cls.className ?? cls.classCode ?? "")}
                  </span>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsáveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {guardianList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum responsável vinculado
            </p>
          )}
          {guardianList.map(g => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.relationship ?? "Responsável"}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {g.phone ?? g.email ?? ""}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Acadêmico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
