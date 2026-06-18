import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Hash, Mail, Phone, Shield, User } from "lucide-react";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function StudentPersonal() {
  const { data: me } = trpc.profiles.student.me.useQuery();
  const student = me as RegistryRow | null | undefined;

  const { data: guardians } = trpc.registry.list.useQuery(
    {
      entity: "studentGuardians" as const,
      filters: { studentId: student?.id },
      limit: 10,
    },
    { enabled: !!student?.id }
  );
  const { data: guardianList } = trpc.registry.list.useQuery(
    { entity: "guardians" as const, limit: 100 },
    { enabled: !!student?.id }
  );

  const linkedGuardians = (guardians ?? []) as RegistryRow[];
  const guardianDetails = linkedGuardians
    .map(lg =>
      (guardianList ?? []).find((g: RegistryRow) => g.id === lg.guardianId)
    )
    .filter(Boolean) as RegistryRow[];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <User className="size-5" />
        Dados Pessoais
      </h2>

      {/* Photo + Name */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:items-start">
          <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-3xl font-bold text-white shadow-lg">
            {student?.name ? String(student.name).charAt(0).toUpperCase() : "?"}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-foreground">
              {String(student?.name ?? "—")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Matrícula:{" "}
              <span className="font-mono font-medium text-foreground">
                {String(student?.enrollmentNumber ?? "—")}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Status:{" "}
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Ativo
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4" />
              Data de Nascimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {student?.dateOfBirth
                ? new Date(String(student.dateOfBirth)).toLocaleDateString(
                    "pt-BR"
                  )
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" />
              E-mail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-sm break-all">
              {String(student?.email ?? "—")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4" />
              Telefone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{String(student?.phone ?? "—")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Hash className="size-4" />
              Série / Turma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{String(student?.grade ?? "—")} ano</p>
          </CardContent>
        </Card>
      </div>

      {/* Guardians */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            Responsáveis
          </CardTitle>
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
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {String(g.phone ?? g.email ?? "")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
