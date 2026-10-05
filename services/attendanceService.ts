import { createCollection } from "@/lib/api";
import { toISODate } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import type { Employee } from "@/types/employee";
import { employeeService } from "./employeeService";

const SEED_EMPLOYEES: [string, string, string][] = [
  ["emp_1", "Santha Kumar", "Operations"],
  ["emp_2", "Priya Raman", "Sales & Admissions"],
  ["emp_3", "Karthik Selvam", "Sales & Admissions"],
  ["emp_4", "Meena Kumari", "Sales & Admissions"],
  ["emp_5", "Rajesh Kannan", "Sales & Admissions"],
  ["emp_6", "Divya Lakshmi", "Human Resources"],
  ["emp_7", "Arun Prakash", "Finance"],
  ["emp_8", "Suresh Babu", "Academics"],
  ["emp_9", "Anitha Joseph", "Academics"],
  ["emp_10", "Vijay Anand", "Academics"],
  ["emp_11", "Revathi Ganesh", "Academics"],
  ["emp_12", "Naveen Raj", "Marketing"],
  ["emp_13", "Keerthana S", "Technology"],
  ["emp_14", "Mani Bharathi", "Operations"],
];

function seedStatus(empIdx: number, dayIdx: number): AttendanceStatus {
  const n = (empIdx * 31 + dayIdx * 17) % 23;
  if (n === 0) return "Absent";
  if (n === 1 || n === 2) return "Late";
  if (n === 3) return "Half Day";
  if (n === 4) return "Leave";
  return "Present";
}

export const attendanceService = createCollection<AttendanceRecord>("attendance", () => {
  const rows: AttendanceRecord[] = [];
  for (let d = 30; d >= 1; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0) continue;
    const iso = toISODate(date);
    SEED_EMPLOYEES.forEach(([employeeId, employeeName, department], e) => {
      const status = seedStatus(e, d);
      const present = status === "Present" || status === "Late" || status === "Half Day";
      rows.push({
        id: `att_${iso}_${employeeId}`,
        employeeId,
        employeeName,
        department,
        date: iso,
        status,
        checkIn: present ? (status === "Late" ? "10:05" : "09:20") : undefined,
        checkOut: present ? (status === "Half Day" ? "13:30" : "18:15") : undefined,
      });
    });
  }
  return rows;
});

export async function getAttendanceByDate(date: string) {
  const rows = await attendanceService.list();
  return rows.filter((r) => r.date === date);
}

/** Creates or updates the attendance record for an employee on a date. */
export async function markAttendance(
  employee: Pick<Employee, "id" | "name" | "department">,
  date: string,
  status: AttendanceStatus,
  times?: { checkIn?: string; checkOut?: string },
) {
  const rows = await attendanceService.list();
  const existing = rows.find((r) => r.date === date && r.employeeId === employee.id);
  const present = status === "Present" || status === "Late" || status === "Half Day";
  const patch = {
    status,
    checkIn: present ? (times?.checkIn ?? existing?.checkIn ?? "09:30") : undefined,
    checkOut: present ? (times?.checkOut ?? existing?.checkOut ?? "18:00") : undefined,
  };
  if (existing) return attendanceService.update(existing.id, patch);
  return attendanceService.create({
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    date,
    ...patch,
  });
}

export async function markAllPresent(date: string) {
  const [employees, rows] = await Promise.all([employeeService.list(), attendanceService.list()]);
  const marked = new Set(rows.filter((r) => r.date === date).map((r) => r.employeeId));
  await Promise.all(
    employees
      .filter((e) => e.status !== "Inactive" && !marked.has(e.id))
      .map((emp) => markAttendance(emp, date, "Present")),
  );
}
