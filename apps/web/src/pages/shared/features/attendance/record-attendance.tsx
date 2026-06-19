import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle2, Menu, Plus } from "lucide-react";
import { useState } from "react";

export default function RecordAttendance() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isAttendanceSheetOpen, setIsAttendanceSheetOpen] = useState(false);

  // Fetch teacher's classes
  const { data: classes = [], isLoading: isLoadingClasses } =
    trpc.profiles.teacher.classes.useQuery(undefined, {
      enabled: !!user,
    });

  const utils = trpc.useUtils();

  // Fetch class sessions for selected class and date via registry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSessions = [], isLoading: isLoadingSessions } =
    trpc.registry.list.useQuery(
      {
        entity: "classSessions" as const,
        filters: selectedClassId
          ? { lessonDate: date.toISOString().split("T")[0] }
          : {},
        limit: 50,
      },
      {
        enabled: !!selectedClassId && !!user,
      }
    );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = rawSessions as any[];

  // Fetch attendance records for selected session
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } =
    trpc.attendance.bySession.useQuery(
      { sessionId: (sessions[0]?.id as number) ?? 0 },
      {
        enabled: !!sessions[0] && !!user,
      }
    );

  // Mutation for creating attendance record
  const attendanceMutation = trpc.attendance.create.useMutation({
    onSuccess: () => {
      void utils.attendance.bySession.invalidate({
        sessionId: (sessions[0]?.id as number) ?? 0,
      });
    },
    onError: (error: unknown) => {
      console.error("Failed to record attendance:", error);
    },
  });

  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Filter classes to only those taught by this teacher (simplified)
  const teacherClasses = classes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Registrar Faltas</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsAttendanceSheetOpen(true)}
            disabled={isLoadingClasses || !teacherClasses.length}
          >
            Selecionar Turma
          </Button>
          <input
            type="date"
            value={date.toISOString().split("T")[0]}
            onChange={e => setDate(new Date(e.target.value))}
            className="border rounded px-3 py-2"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {!teacherClasses.length && !isLoadingClasses && (
        <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
      )}

      {isLoadingClasses && (
        <div className="h-96 flex items-center justify-center">
          <Skeleton className="w-full" />
        </div>
      )}

      {teacherClasses.length > 0 && !isLoadingClasses && (
        <>
          <div className=" bg-muted rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Turma selecionada:{" "}
              {teacherClasses.find(c => c.id === selectedClassId)?.name ||
                "Nenhuma"}
            </p>
          </div>

          {selectedClassId && (
            <>
              {isLoadingSessions && (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="w-full" />
                </div>
              )}

              {!sessions.length && !isLoadingSessions && (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma aula encontrada para esta data.
                </p>
              )}

              {sessions.length > 0 && !isLoadingSessions && (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                      Aulas em{" "}
                      {date.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h2>
                  </div>

                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Aula</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="w-[20%]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map(session => {
                        const studentAttendances = attendanceRecords.filter(
                          att => att.classSessionId === session.id
                        );

                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-muted/50 rounded flex items-center justify-center">
                                  #{session.lessonNumber}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {session.topic || "Aula"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {session.lessonNumber}ª aula
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {studentAttendances.map(attendance => (
                                  <ToggleGroup
                                    key={String(attendance.studentId)}
                                    type="single"
                                    value={attendance.status as string}
                                    onValueChange={(value: string) => {
                                      attendanceMutation.mutate({
                                        classSessionId: session.id as number,
                                        studentId: attendance.studentId as number,
                                        status: value as
                                          | "present"
                                          | "absent"
                                          | "justified",
                                        reason: (attendance.reason as string) || undefined,
                                      });
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <ToggleGroupItem value="present">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="absent">
                                      <Menu className="h-4 w-4 text-red-500" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="justified">
                                      <Calendar className="h-4 w-4 text-yellow-500" />
                                    </ToggleGroupItem>
                                  </ToggleGroup>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="w-[20%]">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  // Open detailed view for this session
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Attendance Detail Sheet */}
      <Sheet
        open={isAttendanceSheetOpen}
        onOpenChange={setIsAttendanceSheetOpen}
      >
        <SheetContent className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle>Selecionar Turma</SheetTitle>
            <SheetDescription>
              Escolha a turma para a qual deseja registrar frequência
            </SheetDescription>
          </SheetHeader>

          {isLoadingClasses ? (
            <div className="py-8 flex items-center justify-center">
              <Skeleton className="w-full h-4" />
            </div>
          ) : teacherClasses.length === 0 ? (
            <p className="text-center py-8">Nenhuma turma encontrada.</p>
          ) : (
            <div className="space-y-4">
              {teacherClasses.map(cls => (
                <Button
                  key={cls.id}
                  variant={selectedClassId === cls.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setIsAttendanceSheetOpen(false);
                  }}
                  className="w-full text-left"
                >
                  {cls.name}
                </Button>
              ))}
            </div>
          )}

          <div className="my-4 border-t" />

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsAttendanceSheetOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setIsAttendanceSheetOpen(false)}
              disabled={!selectedClassId || isLoadingClasses}
            >
              Confirmar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Toaster />
    </div>
  );
}
