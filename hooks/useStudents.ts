"use client";

import { useMemo } from "react";
import { studentService } from "@/services/studentService";
import { useResource } from "./useResource";

export function useStudents() {
  const resource = useResource(studentService);
  const stats = useMemo(() => {
    const rows = resource.data;
    return {
      total: rows.length,
      active: rows.filter((s) => s.status === "Active").length,
      completed: rows.filter((s) => s.status === "Completed").length,
      onHold: rows.filter((s) => s.status === "On Hold" || s.status === "Dropped").length,
    };
  }, [resource.data]);
  return { ...resource, stats };
}
