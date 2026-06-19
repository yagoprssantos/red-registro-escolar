import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import type { RegistryRow } from "@/pages/shared/Types";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Link2,
  Pencil,
  Save,
  School,
  UserPlus,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const SHIFT_LABELS: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  full_day: "Integral",
};

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

export default function SchoolTeachers() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const { data: teachers, refetch: refetchTeachers } = trpc.registry.list.useQuery(
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
  const { data: classSubjects, refetch: refetchSubjects } = trpc.registry.list.useQuery({
    entity: "classSubjects" as const,
    limit: 200,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "" });
  const [linkingTeacherId, setLinkingTeacherId] = useState<number | null>(null);
  const [linkClassId, setLinkClassId] = useState<number | null>(null);
  const [linkSubjectName, setLinkSubjectName] = useState("");
  const [expandedTeacherId, setExpandedTeacherId] = useState<number | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", subject: "" });

  const createTeacher = trpc.registry.create.useMutation();
  const updateTeacher = trpc.registry.update.useMutation();
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
      refetchTeachers();
    } catch {
      toast.error("Erro ao cadastrar professor");
    }
  }

  function startEdit(t: RegistryRow) {
    setEditingTeacherId(t.id as number);
    setEditForm({
      name: String(t.name || ""),
      email: String(t.email || ""),
      phone: String(t.phone || ""),
      subject: String(t.subject || ""),
    });
  }

  async function handleEdit(teacherId: number) {
    try {
      await updateTeacher.mutateAsync({
        entity: "teachers" as const,
        id: teacherId,
        data: {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          subject: editForm.subject.trim() || null,
        },
      });
      toast.success("Professor atualizado!");
      setEditingTeacherId(null);
      refetchTeachers();
    } catch {
      toast.error("Erro ao atualizar professor");
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
      refetchSubjects();
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
    if (!cls) return "—";
    return formatClassName(cls);
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
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-brand hover:bg-red-700" disabled={createTeacher.isPending}>
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
          <p className="text-sm text-muted-foreground">Nenhum professor cadastrado</p>
        )}
        {teacherList.map(t => {
          const isExpanded = expandedTeacherId === (t.id as number);
          const isEditing = editingTeacherId === (t.id as number);
          const assignments = getTeacherAssignments(t.id as number);
          const isLinking = linkingTeacherId === (t.id as number);

          return (
            <div key={String(t.id)} className="rounded-lg border bg-card">
              {/* Teacher header */}
              <div className="flex w-full items-center justify-between px-4 py-3">
                <button
                  onClick={() => setExpandedTeacherId(isExpanded ? null : (t.id as number))}
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <School className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{String(t.name)}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {t.subject && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="size-3" />
                          {String(t.subject)}
                        </span>
                      )}
                      {assignments.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {assignments.length} turma{assignments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.active === 1
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.active === 1 ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingTeacherId(null);
                      } else {
                        startEdit(t);
                        setExpandedTeacherId(t.id as number);
                      }
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Editar"
                  >
                    {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
                  </button>
                  <button
                    onClick={() => setExpandedTeacherId(isExpanded ? null : (t.id as number))}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-4">
                  {/* Edit form */}
                  {isEditing && (
                    <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-3">
                      <h4 className="text-sm font-semibold">Editar professor</h4>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome *</label>
                          <Input
                            value={editForm.name}
                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="Nome completo"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="email@escola.com"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Telefone</label>
                          <Input
                            value={editForm.phone}
                            onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Disciplina principal</label>
                          <Input
                            value={editForm.subject}
                            onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))}
                            placeholder="Ex: Matemática"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-red-brand hover:bg-red-700"
                          onClick={() => handleEdit(t.id as number)}
                          disabled={updateTeacher.isPending || !editForm.name.trim()}
                        >
                          <Save className="mr-1 size-3" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTeacherId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Contact info (when not editing) */}
                  {!isEditing && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>{String(t.email)}</p>
                      {t.phone && <p>{String(t.phone)}</p>}
                    </div>
                  )}

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
                            className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-sm"
                          >
                            <span className="font-medium">{String(a.subjectName || a.name)}</span>
                            <span className="text-muted-foreground">—</span>
                            <span className="text-xs text-muted-foreground">{getClassName(a.classId as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link to class */}
                  {isLinking ? (
                    <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-3">
                      <h4 className="text-sm font-semibold">Vincular à turma</h4>
                      <select
                        value={linkClassId ?? ""}
                        onChange={e => setLinkClassId(Number(e.target.value) || null)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecionar turma...</option>
                        {classList.map(cls => (
                          <option key={String(cls.id)} value={String(cls.id)}>
                            {formatClassName(cls)}
                            {cls.shift ? ` · ${SHIFT_LABELS[String(cls.shift)] || String(cls.shift)}` : ""}
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
                          disabled={!linkClassId || !linkSubjectName.trim() || createClassSubject.isPending}
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
