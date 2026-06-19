import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "approved" | "rejected";

const TABS: { value: FilterTab; label: string; icon: any }[] = [
  { value: "all", label: "Todas", icon: ShieldCheck },
  { value: "pending", label: "Pendentes", icon: Clock },
  { value: "approved", label: "Aprovadas", icon: CheckCircle },
  { value: "rejected", label: "Rejeitadas", icon: XCircle },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
};

type JustificationUI = {
  id: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName?: string;
  guardianName?: string;
  lessonDate?: string;
  teacherName?: string;
  subjectName?: string;
  className?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

export default function SchoolJustifications() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = mySchools?.[0]?.schoolId;

  const [filter, setFilter] = useState<FilterTab>("pending");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [search, setSearch] = useState("");

  const { data: justifications } = trpc.justifications.listBySchool.useQuery(
    { schoolId: schoolId as number },
    { enabled: !!schoolId }
  );

  const utils = trpc.useUtils();
  const reviewMutation = trpc.justifications.review.useMutation({
    onSuccess: () => {
      toast.success("Justificativa revisada!");
      setReviewingId(null);
      setReviewNotes("");
      utils.justifications.listBySchool.invalidate();
    },
    onError: () => toast.error("Erro ao revisar justificativa"),
  });

  const list: JustificationUI[] = (justifications ?? []).map((j: any) => ({
    id: Number(j.id),
    reason: String(j.reason ?? ""),
    status: j.status,
    studentName: j.studentName ? String(j.studentName) : undefined,
    guardianName: j.guardianName ? String(j.guardianName) : undefined,
    lessonDate: j.lessonDate ? String(j.lessonDate) : undefined,
    teacherName: j.teacherName ? String(j.teacherName) : undefined,
    subjectName: j.subjectName ? String(j.subjectName) : undefined,
    className: j.className ? String(j.className) : undefined,
    createdAt: j.createdAt ? String(j.createdAt) : undefined,
    reviewedAt: j.reviewedAt ? String(j.reviewedAt) : undefined,
    reviewNotes: j.reviewNotes ? String(j.reviewNotes) : undefined,
  }));

  const filtered = list
    .filter(j => (filter === "all" ? true : j.status === filter))
    .filter(j => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        j.reason.toLowerCase().includes(q) ||
        (j.studentName ?? "").toLowerCase().includes(q) ||
        (j.guardianName ?? "").toLowerCase().includes(q) ||
        (j.className ?? "").toLowerCase().includes(q) ||
        (j.teacherName ?? "").toLowerCase().includes(q)
      );
    });

  const counts = {
    all: list.length,
    pending: list.filter(j => j.status === "pending").length,
    approved: list.filter(j => j.status === "approved").length,
    rejected: list.filter(j => j.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ShieldCheck className="size-5" />
        Justificativas
      </h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "bg-muted shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="size-3" />
              {tab.label}
              <span className="ml-0.5 rounded-full bg-background/60 px-1 text-[10px]">
                {counts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por aluno, responsável, turma ou professor..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma justificativa encontrada
          </p>
        )}

        {filtered.map(j => {
          const isReviewing = reviewingId === j.id;
          const statusStyle = STATUS_STYLES[j.status] ?? "bg-muted text-muted-foreground";

          return (
            <Card key={j.id} className={j.status === "pending" ? "border-amber-200 dark:border-amber-800" : ""}>
              <CardContent className="py-4 space-y-3">
                {/* Header: status + date submitted */}
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                    {STATUS_LABELS[j.status] ?? j.status}
                  </span>
                  {j.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      Enviada em {new Date(j.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>

                {/* Reason */}
                <p className="text-sm font-medium">{j.reason}</p>

                {/* Info grid */}
                <div className="grid grid-cols-1 gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5 text-xs sm:grid-cols-2">
                  {j.guardianName && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="size-3 shrink-0" />
                      <span>Responsável: <span className="font-medium text-foreground">{j.guardianName}</span></span>
                    </div>
                  )}
                  {j.studentName && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="size-3 shrink-0" />
                      <span>Aluno: <span className="font-medium text-foreground">{j.studentName}</span></span>
                    </div>
                  )}
                  {j.className && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3 shrink-0" />
                      <span>Turma: <span className="font-medium text-foreground">{j.className}</span></span>
                    </div>
                  )}
                  {j.lessonDate && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      <span>Dia da falta: <span className="font-medium text-foreground">
                        {new Date(j.lessonDate + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span></span>
                    </div>
                  )}
                  {j.teacherName && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="size-3 shrink-0" />
                      <span>
                        Professor: <span className="font-medium text-foreground">{j.teacherName}</span>
                        {j.subjectName && <span> · {j.subjectName}</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reviewed note */}
                {j.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Revisada em {new Date(j.reviewedAt).toLocaleDateString("pt-BR")}
                    {j.reviewNotes && ` — "${j.reviewNotes}"`}
                  </p>
                )}

                {/* Actions */}
                {j.status === "pending" && !isReviewing && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-8 bg-green-600 hover:bg-green-700 text-xs"
                      onClick={() =>
                        reviewMutation.mutate({ justificationId: j.id, status: "approved" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle className="mr-1 size-3" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      onClick={() => setReviewingId(j.id)}
                    >
                      <XCircle className="mr-1 size-3" />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {/* Rejection panel */}
                {isReviewing && (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                    <label className="block text-xs font-medium">
                      Motivo da rejeição (opcional)
                    </label>
                    <textarea
                      className="w-full rounded border bg-background p-2 text-sm text-foreground resize-none"
                      rows={2}
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      placeholder="Explique o motivo..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs"
                        onClick={() =>
                          reviewMutation.mutate({
                            justificationId: j.id,
                            status: "rejected",
                            reviewNotes: reviewNotes || undefined,
                          })
                        }
                        disabled={reviewMutation.isPending}
                      >
                        Confirmar rejeição
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => {
                          setReviewingId(null);
                          setReviewNotes("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
