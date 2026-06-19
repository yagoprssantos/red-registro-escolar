import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import { Calendar, CheckCircle, Plus, Settings, UserCheck, UserX, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  teacher: "Professor",
  student: "Aluno",
  guardian: "Responsável",
  school_staff: "Gestão",
  admin: "Admin",
};

const ROLE_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "teacher", label: "Professores" },
  { value: "student", label: "Alunos" },
  { value: "guardian", label: "Responsáveis" },
];

export default function SchoolSettings() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const { data: schoolYears } = trpc.registry.list.useQuery(
    {
      entity: "schoolYears" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 20,
    },
    { enabled: !!schoolId }
  );
  const { data: users } = trpc.school.users.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const [showCreateYear, setShowCreateYear] = useState(false);
  const [yearForm, setYearForm] = useState({ year: "", startDate: "", endDate: "" });
  const [userFilter, setUserFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");

  const createYear = trpc.registry.create.useMutation();
  const updateUser = trpc.registry.update.useMutation();

  const yearList = (schoolYears ?? []) as RegistryRow[];
  const userList = (users ?? []) as RegistryRow[];

  const filteredUsers = userList
    .filter(u => userFilter === "all" || String(u.role) === userFilter)
    .filter(u => {
      if (!userSearch) return true;
      const q = userSearch.toLowerCase();
      return (
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q)
      );
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

      {/* ── Anos Letivos ── */}
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
              Novo
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
                  onChange={e => setYearForm(p => ({ ...p, year: e.target.value }))}
                  required
                />
                <Input
                  type="date"
                  placeholder="Início"
                  value={yearForm.startDate}
                  onChange={e => setYearForm(p => ({ ...p, startDate: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Fim"
                  value={yearForm.endDate}
                  onChange={e => setYearForm(p => ({ ...p, endDate: e.target.value }))}
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
            <p className="text-sm text-muted-foreground">Nenhum ano letivo cadastrado</p>
          )}

          <div className="space-y-2">
            {yearList.map(year => {
              const isActive = year.isActive === 1 || year.isCurrent === 1;
              return (
                <div
                  key={String(year.id)}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${
                        isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                      }`}
                    >
                      <Calendar
                        className={`size-4 ${
                          isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {String(year.year || year.label)}
                        {isActive && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Ativo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {year.startDate
                          ? new Date(String(year.startDate)).toLocaleDateString("pt-BR")
                          : "Início não definido"}
                        {" — "}
                        {year.endDate
                          ? new Date(String(year.endDate)).toLocaleDateString("pt-BR")
                          : "Em andamento"}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20"
                      onClick={() => handleCloseYear(year.id as number)}
                      disabled={updateUser.isPending}
                    >
                      Encerrar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Gerenciar Usuários ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Gerenciar Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar por nome ou email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="flex-1 min-w-[180px]"
            />
            <div className="flex flex-wrap gap-1">
              {ROLE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setUserFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    userFilter === f.value
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", count: userList.length, color: "text-foreground" },
              { label: "Professores", count: userList.filter(u => u.role === "teacher").length, color: "text-blue-600" },
              { label: "Alunos", count: userList.filter(u => u.role === "student").length, color: "text-green-600" },
              { label: "Responsáveis", count: userList.filter(u => u.role === "guardian").length, color: "text-amber-600" },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          {/* User list */}
          {filteredUsers.length === 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado
            </p>
          )}
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {filteredUsers.slice(0, 100).map(u => {
              const isActive = u.isActive !== 0;
              const role = String(u.role);
              const roleLabel = ROLE_LABELS[role] ?? role;
              return (
                <div
                  key={String(u.id)}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                        isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                      }`}
                    >
                      {isActive ? (
                        <UserCheck className="size-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <UserX className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{String(u.name)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {String(u.email || "")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="hidden sm:block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {roleLabel}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 px-2 text-xs ${
                        isActive
                          ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                      }`}
                      onClick={() => handleToggleUser(u.id as number, isActive)}
                      disabled={updateUser.isPending}
                    >
                      {isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length > 100 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                Mostrando 100 de {filteredUsers.length} usuários
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Confirmação visual ── */}
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/20">
        <CheckCircle className="size-4 text-green-600 shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400">
          Alterações são salvas automaticamente. Dados protegidos conforme LGPD.
        </p>
      </div>
    </div>
  );
}
