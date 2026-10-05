"use client";

import { useMemo } from "react";
import { employeeService } from "@/services/employeeService";
import { useResource } from "./useResource";

export function useEmployees() {
  const resource = useResource(employeeService);
  const stats = useMemo(() => {
    const rows = resource.data;
    return {
      total: rows.length,
      active: rows.filter((e) => e.status === "Active").length,
      onLeave: rows.filter((e) => e.status === "On Leave").length,
      departments: new Set(rows.map((e) => e.department)).size,
      payroll: rows.reduce((acc, e) => acc + (Number(e.salary) || 0), 0),
    };
  }, [resource.data]);
  return { ...resource, stats };
}
