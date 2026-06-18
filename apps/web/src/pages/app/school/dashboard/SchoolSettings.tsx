import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Calendar,
  Download,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { RegistryRow } from "../../../shared/DashboardShell";

export default function SchoolSettings() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const { data: schoolYears } = trpc.registry.list.useQuery(
    {
      entity: "schoolYears" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 20,
    },
    { enabled: !!schoolId }
  );
  const { data: users } = trpc.registry.list.useQuery(
    {
      entity: "users" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 500,
    },
    { enabled: !!schoolId }
  );

  const [showCreateYear, setShowCreateYear] = useState(false);
  const [yearForm, setYearForm] = useState({
    year: "",
    startDate: "",
    endDate: "",
  });
  const [userFilter, setUserFilter] = useState<string>("all");
  const [lgpdStudentSearch, setLgpdStudentSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const createYear = trpc.registry.create.useMutation();
  const updateUser = trpc.registry.update.useMutation();
  const restoreRow = trpc.registry.restore.useMutation();

  const { data: deletedRecords } = trpc.registry.listDeleted.useQuery(
    { entity: "students" as const, limit: 50 },
    { enabled: showDeleted }
  );

  const yearList = (schoolYears ?? []) as RegistryRow[];
  const userList = (users ?? []) as RegistryRow[];

  const filteredUsers = userList.filter(u => {
    if (userFilter === "all") return true;
    return String(u.role) === userFilter;
  });

  async function handleCreateYear(e: FormEvent) {
    e.preventDefault();
    if (!schoolId) return;

    try {
      await createYear.mutateAsync({
        entity: "schoolYears" as const,
        data: {
          schoolId,
          year: yearForm.year || String(new Date().getFullYear()),
          label: yearForm.year || String(new Date().getFullYear()),
          startDate: yearForm.startDate || undefined,
          endDate: yearForm.endDate || undefined,
          isActive: 1,
          isCurrent: 0,
          status: "active",
        },
      });
      toast.success("Ano letivo criado!");
      setShowCreateYear(false);
      setYearForm({ year: "", startDate: "", endDate: "" });
    } catch {
      toast.error("Erro ao criar ano letivo");
    }
  }

  async function handleCloseYear(yearId: number) {
    try {
      await updateUser.mutateAsync({
        entity: "schoolYears" as const,
        id: yearId,
        data: { isActive: 0, isCurrent: 0, status: "closed" },
      });
      toast.success("Ano letivo encerrado!");
    } catch {
      toast.error("Erro ao encerrar ano letivo");
    }
  }

  async function handleToggleUser(userId: number, currentActive: boolean) {
    try {
      await updateUser.mutateAsync({
        entity: "users" as const,
        id: userId,
        data: { isActive: currentActive ? 0 : 1 },
      });
      toast.success(currentActive ? "Usuário desativado" : "Usuário ativado");
    } catch {
      toast.error("Erro ao atualizar usuário");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Settings className="size-5" />
        Configurações
      </h2>

      {/* School Year Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4" />
              Anos Letivos
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowCreateYear(true)}
              className="bg-red-brand hover:bg-red-700"
            >
              <Plus className="mr-1 size-3" />
              Novo Ano Letivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showCreateYear && (
            <form
              onSubmit={handleCreateYear}
              className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Ano (ex: 2026) *"
                  value={yearForm.year}
                  onChange={e =>
                    setYearForm(p => ({ ...p, year: e.target.value }))
                  }
                  required
                />
                <Input
                  type="date"
                  placeholder="Início"
                  value={yearForm.startDate}
                  onChange={e =>
                    setYearForm(p => ({ ...p, startDate: e.target.value }))
                  }
                />
                <Input
                  type="date"
                  placeholder="Fim"
                  value={yearForm.endDate}
                  onChange={e =>
                    setYearForm(p => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={createYear.isPending}
                >
                  Criar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateYear(false);
                    setYearForm({ year: "", startDate: "", endDate: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {yearList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum ano letivo cadastrado
            </p>
          )}
          {yearList.map(year => {
            const isActive = year.isActive === 1 || year.isCurrent === 1;
            return (
              <div
                key={String(year.id)}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {String(year.year || year.label)}
                    {isActive && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Ativo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {year.startDate
                      ? `${new Date(String(year.startDate)).toLocaleDateString("pt-BR")} — `
                      : ""}
                    {year.endDate
                      ? new Date(String(year.endDate)).toLocaleDateString(
                          "pt-BR"
                        )
                      : "Em andamento"}
                  </p>
                </div>
                {isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 hover:bg-amber-50"
                    onClick={() => handleCloseYear(year.id as number)}
                    disabled={updateUser.isPending}
                  >
                    Encerrar
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Gerenciar Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Role filter */}
          <div className="flex flex-wrap gap-1">
            {[
              { value: "all", label: "Todos" },
              { value: "teacher", label: "Professores" },
              { value: "student", label: "Alunos" },
              { value: "guardian", label: "Responsáveis" },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setUserFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  userFilter === f.value
                    ? "bg-muted text-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário encontrado
            </p>
          )}
          <div className="space-y-1">
            {filteredUsers.slice(0, 50).map(u => {
              const isActive = u.isActive === 1;
              const role = String(u.role);
              const roleLabel =
                role === "teacher"
                  ? "Professor"
                  : role === "student"
                    ? "Aluno"
                    : role === "guardian"
                      ? "Responsável"
                      : role === "school" || role === "admin"
                        ? "Escola"
                        : role;
              return (
                <div
                  key={String(u.id)}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{String(u.name)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {String(u.email || "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {roleLabel}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-xs ${isActive ? "text-red-500 hover:text-red-600" : "text-green-600 hover:text-green-700"}`}
                      onClick={() => handleToggleUser(u.id as number, isActive)}
                      disabled={updateUser.isPending}
                    >
                      {isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length > 50 && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrando 50 de {filteredUsers.length} usuários
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ações irreversíveis. Dados excluídos não podem ser recuperados.
          </p>
          <div className="space-y-2">
            {/* LGPD Export */}
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 dark:bg-blue-950/10">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Exportar dados do aluno (LGPD Art. 18)
                </p>
                <p className="text-xs text-muted-foreground">
                  Download de todos os dados de um aluno em formato JSON
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={async () => {
                  if (!schoolId) return;
                  const search = lgpdStudentSearch.trim();
                  if (!search) {
                    toast.error("Busque um aluno pelo nome ou matrícula");
                    return;
                  }
                  try {
                    const result = await trpc.school.exportStudentData.query({
                      schoolId,
                      studentId: Number(search),
                    });
                    const blob = new Blob([JSON.stringify(result, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `lgpd-aluno-${search}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Dados exportados!");
                  } catch {
                    toast.error("Aluno não encontrado ou sem acesso");
                  }
                }}
              >
                <Download className="mr-1 size-4" /> Exportar
              </Button>
            </div>

            {/* Soft-deleted records */}
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:bg-amber-950/10">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Registros deletados (soft-delete)
                </p>
                <p className="text-xs text-muted-foreground">
                  Visualize e restaure registros removidos recentemente
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                {showDeleted ? "Ocultar" : "Ver Deletados"}
              </Button>
            </div>

            {showDeleted &&
              ((deletedRecords as RegistryRow[]) ?? []).length > 0 && (
                <div className="space-y-1 mt-2">
                  {((deletedRecords as RegistryRow[] | undefined) ?? []).map(
                    r => (
                      <div
                        key={String(r.id)}
                        className="flex items-center justify-between rounded-md bg-amber-50/30 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{String(r.name)}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            Deletado em:{" "}
                            {r.deletedAt
                              ? new Date(
                                  String(r.deletedAt)
                                ).toLocaleDateString("pt-BR")
                              : ""}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-green-600 hover:text-green-700"
                          onClick={() => {
                            restoreRow.mutate(
                              {
                                entity: "students" as const,
                                id: r.id as number,
                              },
                              {
                                onSuccess: () => {
                                  toast.success("Registro restaurado!");
                                },
                                onError: () => toast.error("Erro ao restaurar"),
                              }
                            );
                          }}
                          disabled={restoreRow.isPending}
                        >
                          Restaurar
                        </Button>
                      </div>
                    )
                  )}
                </div>
              )}

            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 dark:bg-red-950/10">
              <div>
                <p className="text-sm font-medium text-red-600">
                  Exportar dados da escola
                </p>
                <p className="text-xs text-muted-foreground">
                  Download de todos os dados em formato JSON (LGPD)
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Exportar
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 dark:bg-red-950/10">
              <div>
                <p className="text-sm font-medium text-red-600">
                  Redefinir senhas em massa
                </p>
                <p className="text-xs text-muted-foreground">
                  Gera novas credenciais temporárias para todos os usuários
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Redefinir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
