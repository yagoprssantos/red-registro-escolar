import { useState } from "react";

const STORAGE_KEY = "guardian-selected-student-id";

export function useGuardianStudent() {
  const [selectedStudentId, setSelectedStudentIdState] = useState<number | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? Number(stored) : null;
    } catch {
      return null;
    }
  });

  const setSelectedStudentId = (id: number | null) => {
    setSelectedStudentIdState(id);
    try {
      if (id != null) sessionStorage.setItem(STORAGE_KEY, String(id));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return { selectedStudentId, setSelectedStudentId };
}
