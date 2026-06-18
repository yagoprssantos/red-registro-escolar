import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, Search, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RegistryRow } from "../../../shared/DashboardShell";

type FilterTab = "all" | "pending" | "approved" | "rejected";

const TABS: { value: FilterTab; label: string; icon: typeof Clock }[] = [
  { value: "all", label: "Todas", icon: ShieldCheck },
  { value: "pending", label: "Pendentes", icon: Clock },
  { value: "approved", label: "Aprovadas", icon: CheckCircle },
  { value: "rejected", label: "Rejeitadas", icon: XCircle },
];

export default function SchoolJustifications() {
  const { data: mySchools } = trpc.schools.mySchools.useQuery();
  const schoolId = (mySchools?.[0] as RegistryRow)?.id as number | undefined;

  const [filter, setFilter] = useState<FilterTab>("pending");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [search, setSearch] = useState("");

  const { data: justifications } = trpc.justifications.listBySchool.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const reviewMutation = trpc.justifications.review.useMutation({
    onSuccess: () => {
      toast.success("Justificativa revisada!");
      setReviewingId(null);
      setReviewNotes("");
    },
    onError: () => toast.error("Erro ao revisar justificativa"),
  });

  const jList = ((justifications ?? []) as RegistryRow[])
    .filter(j => {
      if (filter === "all") return true;
      return String(j.status) === filter;
    })
    .filter(j => {
      if (!search) return true;
      return (
        String(j.reason).toLowerCase().includes(search.toLowerCase()) ||
        String(j.studentName || j.guardianName || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });

  const counts = {
    all: ((justifications ?? []) as RegistryRow[]).length,
    pending: ((justifications ?? []) as RegistryRow[]).filter(
      j => String(j.status) === "pending"
    ).length,
    approved: ((justifications ?? []) as RegistryRow[]).filter(
      j => String(j.status) === "approved"
    ).length,
    rejected: ((justifications ?? []) as RegistryRow[]).filter(
      j => String(j.status) === "rejected"
    ).length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ShieldCheck className="size-5" />
        Justificativas
      </h2>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const count = counts[tab.value];
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "bg-muted text-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="size-3" />
              {tab.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === tab.value ? "bg-foreground/10" : "bg-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por motivo, aluno ou responsável..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Justifications list */}
      <div className="space-y-2">
        {jList.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma justificativa{" "}
            {filter === "pending"
              ? "pendente"
              : filter === "approved"
                ? "aprovada"
                : filter === "rejected"
                  ? "rejeitada"
                  : ""}
          </p>
        )}
        {jList.map(j => {
          const status = String(j.status);
          const isReviewing = reviewingId === (j.id as number);
          return (
            <Card
              key={String(j.id)}
              className={`${
                status === "pending"
                  ? "border-amber-200 dark:border-amber-800"
                  : status === "approved"
                    ? "border-green-200 dark:border-green-800"
                    : "border-red-200 dark:border-red-800"
              }`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {String(j.reason).substring(0, 100)}
                      </p>
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === "pending"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : status === "approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {status === "pending" && <Clock className="size-3" />}
                        {status === "approved" && (
                          <CheckCircle className="size-3" />
                        )}
                        {status === "rejected" && (
                          <XCircle className="size-3" />
                        )}
                        {status === "pending"
                          ? "Pendente"
                          : status === "approved"
                            ? "Aprovada"
                            : "Rejeitada"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {j.studentName && `Aluno: ${String(j.studentName)} · `}
                      {j.guardianName &&
                        `Responsável: ${String(j.guardianName)} · `}
                      {j.createdAt
                        ? new Date(String(j.createdAt)).toLocaleDateString(
                            "pt-BR"
                          )
                        : ""}
                    </p>
                    {j.reviewedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Revisado em:{" "}
                        {new Date(String(j.reviewedAt)).toLocaleDateString(
                          "pt-BR"
                        )}
                        {j.reviewNotes && ` — "${String(j.reviewNotes)}"`}
                      </p>
                    )}
                  </div>

                  {/* Action buttons for pending */}
                  {status === "pending" && !isReviewing && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() =>
                          reviewMutation.mutate({
                            justificationId: j.id as number,
                            status: "approved",
                          })
                        }
                        disabled={reviewMutation.isPending}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setReviewingId(j.id as number)}
                        disabled={reviewMutation.isPending}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Review modal for rejection with notes */}
                {isReviewing && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
                    <h4 className="text-sm font-medium text-red-600 mb-2">
                      Rejeitar justificativa
                    </h4>
                    <textarea
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      rows={2}
                      placeholder="Motivo da rejeição (opcional)"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          reviewMutation.mutate({
                            justificationId: j.id as number,
                            status: "rejected",
                            notes: reviewNotes.trim() || undefined,
                          })
                        }
                        disabled={reviewMutation.isPending}
                      >
                        {reviewMutation.isPending
                          ? "Rejeitando..."
                          : "Confirmar Rejeição"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
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
