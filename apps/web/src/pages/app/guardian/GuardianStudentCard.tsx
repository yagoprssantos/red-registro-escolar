import { UserCircle2 } from "lucide-react";

type StudentEntry = {
  id: number;
  name?: string | null;
  grade?: string | null;
  enrollmentNumber?: string | null;
  avatarUrl?: string | null;
};

type Props = {
  students: StudentEntry[];
  selectedStudentId: number | null;
  onSelect: (id: number) => void;
};

export default function GuardianStudentCard({ students, selectedStudentId, onSelect }: Props) {
  const selectedStudent = students.find(s => s.id === selectedStudentId) ?? null;

  if (students.length === 0) return null;

  // Auto-select first if nothing selected
  if (!selectedStudent && students.length > 0) {
    // Call onSelect on next tick to avoid render-during-render
    setTimeout(() => onSelect(students[0].id), 0);
    return null;
  }

  if (!selectedStudent) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted">
        {selectedStudent.avatarUrl ? (
          <img
            src={selectedStudent.avatarUrl}
            alt={selectedStudent.name ?? "—"}
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <UserCircle2 className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">
          {selectedStudent.name ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          Matrícula: {selectedStudent.enrollmentNumber ?? "—"}
        </p>
        {selectedStudent.grade && (
          <p className="text-xs text-muted-foreground">
            Série: {selectedStudent.grade}
          </p>
        )}
      </div>
      {students.length > 1 && (
        <button
          onClick={() => {
            const idx = students.findIndex(s => s.id === selectedStudentId);
            const next = students[(idx + 1) % students.length];
            onSelect(next.id);
          }}
          className="ml-auto shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Trocar
        </button>
      )}
    </div>
  );
}
