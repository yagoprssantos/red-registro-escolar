import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import {
  ChevronDown,
  ChevronUp,
  Link2,
  School,
  UserPlus,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function SchoolTeachers() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const { data: teachers } = trpc.registry.list.useQuery(
    {
      entity: "teachers" as const,
      filters: schoolId ? { schoolId } : {},
      limit: 200,
    },
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
  const { data: classSubjects } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: 200,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
  });
  const [linkingTeacherId, setLinkingTeacherId] = useState<number | null>(null);
  const [linkClassId, setLinkClassId] = useState<number | null>(null);
  const [linkSubjectName, setLinkSubjectName] = useState("");
  const [expandedTeacherId, setExpandedTeacherId] = useState<number | null>(
    null
  );

  const createTeacher = trpc.registry.create.useMutation();
  const createClassSubject = trpc.registry.create.useMutation();
  const teacherList = (teachers ?? []) as RegistryRow[];
  const classList = (classes ?? []) as RegistryRow[];
  const subjectList = (classSubjects ?? []) as RegistryRow[];

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!schoolId) return;

    try {
      await createTeacher.mutateAsync({
        entity: "teachers" as const,
        data: {
          schoolId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          subject: form.subject.trim() || null,
          active: 1,
        },
      });
      toast.success("Professor cadastrado!");
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", subject: "" });
    } catch {
      toast.error("Erro ao cadastrar professor");
    }
  }

  async function handleLinkClass() {
    if (!linkingTeacherId || !linkClassId || !linkSubjectName.trim()) return;

    try {
      await createClassSubject.mutateAsync({
        entity: "classSubjects" as const,
        data: {
          classId: linkClassId,
          teacherId: linkingTeacherId,
          subjectName: linkSubjectName.trim(),
          name: linkSubjectName.trim(),
        },
      });
      toast.success("Professor vinculado à turma!");
      setLinkingTeacherId(null);
      setLinkClassId(null);
      setLinkSubjectName("");
    } catch {
      toast.error("Erro ao vincular professor");
    }
  }

  function getTeacherAssignments(teacherId: number) {
    return subjectList.filter(s => s.teacherId === teacherId);
  }

  function getClassName(classId: number | undefined) {
    if (!classId) return "—";
    const cls = classList.find(c => c.id === classId);
    return cls ? String(cls.name) : "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Professores</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-red-brand hover:bg-red-700"
        >
          <UserPlus className="mr-2 size-4" />
          Novo Professor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Novo Professor</CardTitle>
              <button onClick={() => setShowForm(false)}>
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Nome completo *"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Email *"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Telefone"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
              <Input
                placeholder="Disciplina principal"
                value={form.subject}
                onChange={e =>
                  setForm(p => ({ ...p, subject: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-red-brand hover:bg-red-700"
                  disabled={createTeacher.isPending}
                >
                  Cadastrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Teacher list */}
      <div className="space-y-2">
        {teacherList.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum professor cadastrado
          </p>
        )}
        {teacherList.map(t => {
          const isExpanded = expandedTeacherId === (t.id as number);
          const assignments = getTeacherAssignments(t.id as number);
          const isLinking = linkingTeacherId === (t.id as number);

          return (
            <div key={String(t.id)} className="rounded-lg border bg-card">
              {/* Teacher header */}
              <button
                onClick={() =>
                  setExpandedTeacherId(isExpanded ? null : (t.id as number))
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <School className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{String(t.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(t.email)}{" "}
                      {t.subject ? `· ${String(t.subject)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.active === 1
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.active === 1 ? "Ativo" : "Inativo"}
                  </span>
                  {assignments.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {assignments.length} turma
                      {assignments.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-3">
                  {/* Current assignments */}
                  {assignments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Link2 className="size-3" />
                        Turmas vinculadas
                      </h4>
                      <div className="space-y-1">
                        {assignments.map(a => (
                          <div
                            key={String(a.id)}
                            className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-sm"
                          >
                            <span>{String(a.subjectName || a.name)}</span>
                            <span className="text-xs text-muted-foreground">
                              {getClassName(a.classId as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link to class */}
                  {isLinking ? (
                    <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-3">
                      <h4 className="text-sm font-semibold">
                        Vincular à turma
                      </h4>
                      <select
                        value={linkClassId ?? ""}
                        onChange={e =>
                          setLinkClassId(Number(e.target.value) || null)
                        }
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecionar turma...</option>
                        {classList.map(cls => (
                          <option key={String(cls.id)} value={String(cls.id)}>
                            {String(cls.name)} — {String(cls.gradeLabel || "")}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Nome da disciplina *"
                        value={linkSubjectName}
                        onChange={e => setLinkSubjectName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-red-brand hover:bg-red-700"
                          disabled={
                            !linkClassId ||
                            !linkSubjectName.trim() ||
                            createClassSubject.isPending
                          }
                          onClick={handleLinkClass}
                        >
                          Vincular
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setLinkingTeacherId(null);
                            setLinkClassId(null);
                            setLinkSubjectName("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLinkingTeacherId(t.id as number);
                        setLinkClassId(null);
                        setLinkSubjectName(String(t.subject || ""));
                      }}
                    >
                      <Link2 className="mr-1 size-3" />
                      Vincular à turma
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
