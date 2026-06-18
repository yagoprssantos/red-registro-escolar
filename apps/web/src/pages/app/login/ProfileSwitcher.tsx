import { trpc } from "@/lib/trpc";
import { ChevronDown, Users } from "lucide-react";
import { useEffect } from "react";

interface ProfileSwitcherProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
  type: "student" | "guardian";
}

export function ProfileSwitcher({
  selectedId,
  onSelect,
  type,
}: ProfileSwitcherProps) {
  const { data: students } = trpc.profiles.guardian.students.useQuery(
    undefined,
    {
      enabled: type === "guardian",
    }
  );

  const items =
    students?.map((s: Record<string, unknown>) => ({
      id: s.id as number,
      name: s.name as string,
      grade: (s.grade || s.gradeLabel || "") as string,
      enrollmentNumber: (s.enrollmentNumber || "") as string,
    })) ?? [];

  // Auto-select first student if only one
  useEffect(() => {
    if (items.length === 1 && selectedId !== items[0].id) {
      onSelect(items[0].id);
    }
  }, [items.length]);

  // Don't render if only one or no students
  if (items.length <= 1) return null;

  const selected = items.find(i => i.id === selectedId);

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <Users className="size-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Aluno:</span>
      <div className="relative flex-1">
        <select
          value={selectedId ?? ""}
          onChange={e => onSelect(Number(e.target.value))}
          className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-foreground outline-none"
          aria-label="Selecionar aluno"
        >
          {items.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.grade ? ` — ${item.grade}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-0 top-1/2 size-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {selected && selected.enrollmentNumber && (
        <span className="text-xs text-muted-foreground">
          #{selected.enrollmentNumber}
        </span>
      )}
    </div>
  );
}
