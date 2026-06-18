import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  BookOpenCheck,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { RegistryRow } from "../../../shared/DashboardShell";
import { ProfileSwitcher } from "../../login/ProfileSwitcher";

export default function GuardianDashboard() {
  const { data: students } = trpc.profiles.guardian.students.useQuery();
  const { data: notifications } = trpc.registry.notifications.mine.useQuery({
    unreadOnly: true,
    limit: 20,
  });

  const studentList = (students ?? []) as RegistryRow[];
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    studentList.length === 1 ? (studentList[0].id as number) : null
  );

  const alertNotifs = (notifications ?? []).filter(
    (n: RegistryRow) => (n.notificationType as string) === "absence_alert"
  );

  // Get performance for selected student
  const { data: performance } =
    trpc.profiles.guardian.studentPerformance.useQuery(
      { studentId: selectedStudentId! },
      { enabled: !!selectedStudentId }
    );
  const perf = performance as RegistryRow | null;

  // Pending justifications
  const { data: justifications } = trpc.registry.list.useQuery({
    entity: "absenceJustifications" as const,
    filters: { status: "pending" },
    limit: 50,
  });
  const pendingJustifications = ((justifications ?? []) as RegistryRow[])
    .length;

  return (
    <div className="space-y-6">
      {/* Student selector for multi-child */}
      <ProfileSwitcher
        selectedId={selectedStudentId}
        onSelect={setSelectedStudentId}
        type="guardian"
      />

      {/* Absence alert */}
      {alertNotifs.length > 0 && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-semibold">
              ⚠️ Alerta — falta registrada
            </span>
          </div>
          {alertNotifs.slice(0, 3).map((n: { id: any; body: any }) => (
            <p
              key={String(n.id)}
              className="mt-1 text-sm text-red-700 dark:text-red-400"
            >
              {String(n.body)}
            </p>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Dependentes</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Faltas do filho
            </CardTitle>
            <AlertTriangle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {perf
                ? String(perf.absenceCount ?? perf.totalAbsences ?? "—")
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Média do filho
            </CardTitle>
            <BookOpenCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {perf ? String(perf.average ?? perf.gpa ?? "—") : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className={pendingJustifications > 0 ? "border-amber-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Justificativas pendentes
            </CardTitle>
            <ShieldCheck
              className={
                pendingJustifications > 0
                  ? "size-4 text-amber-500"
                  : "size-4 text-muted-foreground"
              }
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pendingJustifications > 0 ? "text-amber-600" : ""
              }`}
            >
              {pendingJustifications}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My dependents */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Meus dependentes</h3>
        <div className="space-y-2">
          {studentList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum dependente vinculado
            </p>
          )}
          {studentList.map(s => (
            <div
              key={String(s.id)}
              className={`flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors ${
                selectedStudentId === (s.id as number)
                  ? "border-red-brand/30 bg-red-brand/5"
                  : ""
              } ${studentList.length > 1 ? "cursor-pointer hover:bg-muted" : ""}`}
              onClick={() =>
                studentList.length > 1 && setSelectedStudentId(s.id as number)
              }
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {String(s.name)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Matrícula: {String(s.enrollmentNumber || "—")}
                </p>
              </div>
              {studentList.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  {selectedStudentId === (s.id as number) ? "●" : "○"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
