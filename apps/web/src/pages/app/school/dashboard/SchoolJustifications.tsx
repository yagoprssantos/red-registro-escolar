import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "approved" | "rejected";

const TABS: { value: FilterTab; label: string; icon: any }[] = [
  { value: "all", label: "Todas", icon: ShieldCheck },
  { value: "pending", label: "Pendentes", icon: Clock },
  { value: "approved", label: "Aprovadas", icon: CheckCircle },
  { value: "rejected", label: "Rejeitadas", icon: XCircle },
];

type JustificationUI = {
  id: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  studentName?: string;
  guardianName?: string;
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

  const reviewMutation = trpc.justifications.review.useMutation({
    onSuccess: () => {
      toast.success("Justificativa revisada!");
      setReviewingId(null);
      setReviewNotes("");
    },
    onError: () => toast.error("Erro ao revisar justificativa"),
  });

  const list: JustificationUI[] = (justifications ?? []).map((j: any) => ({
    id: Number(j.id),
    reason: String(j.reason ?? ""),
    status: j.status,
    studentName: j.studentName ? String(j.studentName) : undefined,
    guardianName: j.guardianName ? String(j.guardianName) : undefined,
    createdAt: j.createdAt ? String(j.createdAt) : undefined,
    reviewedAt: j.reviewedAt ? String(j.reviewedAt) : undefined,
    reviewNotes: j.reviewNotes ? String(j.reviewNotes) : undefined,
  }));

  const filtered = list
    .filter(j => (filter === "all" ? true : j.status === filter))
    .filter(j => {
      if (!search) return true;
      return (
        j.reason.toLowerCase().includes(search.toLowerCase()) ||
        (j.studentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (j.guardianName ?? "").toLowerCase().includes(search.toLowerCase())
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
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
                filter === tab.value
                  ? "bg-muted"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="size-3" />
              {tab.label}
              <span className="ml-1 text-[10px]">{counts[tab.value]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma justificativa encontrada
          </p>
        )}

        {filtered.map(j => {
          const isReviewing = reviewingId === j.id;

          return (
            <Card key={j.id}>
              <CardContent className="py-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{j.reason}</p>

                    <p className="text-xs text-muted-foreground">
                      {j.studentName && `Aluno: ${j.studentName} · `}
                      {j.guardianName && `Responsável: ${j.guardianName} · `}
                      {j.createdAt
                        ? new Date(j.createdAt).toLocaleDateString("pt-BR")
                        : ""}
                    </p>

                    {j.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Revisado em{" "}
                        {new Date(j.reviewedAt).toLocaleDateString("pt-BR")}
                        {j.reviewNotes && ` — "${j.reviewNotes}"`}
                      </p>
                    )}
                  </div>

                  {j.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          reviewMutation.mutate({
                            justificationId: j.id,
                            status: "approved",
                          })
                        }
                      >
                        Aprovar
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setReviewingId(j.id)}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>

                {/* rejection panel */}
                {isReviewing && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className="w-full rounded border bg-background p-2 text-sm text-foreground"
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          reviewMutation.mutate({
                            justificationId: j.id,
                            status: "rejected",
                            reviewNotes: reviewNotes || undefined,
                          })
                        }
                      >
                        Confirmar
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
