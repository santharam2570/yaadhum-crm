"use client";

import { useMemo } from "react";
import { attendanceService, markAllPresent, markAttendance } from "@/services/attendanceService";
import type { AttendanceStatus } from "@/types/attendance";
import type { Employee } from "@/types/employee";
import { useEmployees } from "./useEmployees";
import { useResource } from "./useResource";

export function useAttendance(date: string) {
  const records = useResource(attendanceService);
  const employees = useEmployees();

  const rows = useMemo(() => {
    const byEmp = new Map(records.data.filter((r) => r.date === date).map((r) => [r.employeeId, r]));
    return employees.data
      .filter((e) => e.status !== "Inactive")
      .map((employee) => ({ employee, record: byEmp.get(employee.id) }));
  }, [records.data, employees.data, date]);

  const summary = useMemo(() => {
    const count = (s: AttendanceStatus) => rows.filter((r) => r.record?.status === s).length;
    return {
      total: rows.length,
      present: count("Present"),
      late: count("Late"),
      halfDay: count("Half Day"),
      absent: count("Absent"),
      leave: count("Leave"),
      unmarked: rows.filter((r) => !r.record).length,
    };
  }, [rows]);

  return {
    rows,
    summary,
    loading: records.loading || employees.loading,
    mark: (employee: Employee, status: AttendanceStatus) => markAttendance(employee, date, status),
    markAllPresent: () => markAllPresent(date),
  };
}
