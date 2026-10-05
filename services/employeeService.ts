import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Department, Employee, PerformanceReview } from "@/types/employee";

export const DEPARTMENTS = [
  "Academics",
  "Sales & Admissions",
  "Human Resources",
  "Finance",
  "Marketing",
  "Technology",
  "Operations",
];

const STAFF: [string, string, string, number][] = [
  ["Santha Kumar", "Operations", "Managing Director", 150000],
  ["Priya Raman", "Sales & Admissions", "Admissions Manager", 75000],
  ["Karthik Selvam", "Sales & Admissions", "Senior Counsellor", 42000],
  ["Meena Kumari", "Sales & Admissions", "Counsellor", 32000],
  ["Rajesh Kannan", "Sales & Admissions", "Counsellor", 30000],
  ["Divya Lakshmi", "Human Resources", "HR Executive", 38000],
  ["Arun Prakash", "Finance", "Accountant", 40000],
  ["Suresh Babu", "Academics", "Lead Trainer - Full Stack", 68000],
  ["Anitha Joseph", "Academics", "Trainer - Data Science", 72000],
  ["Vijay Anand", "Academics", "Trainer - Cloud & DevOps", 60000],
  ["Revathi Ganesh", "Academics", "Trainer - UI/UX", 52000],
  ["Naveen Raj", "Marketing", "Digital Marketing Lead", 55000],
  ["Keerthana S", "Technology", "Software Engineer", 48000],
  ["Mani Bharathi", "Operations", "Front Office Executive", 22000],
];

export const EMPLOYEE_NAMES = STAFF.map((s) => s[0]);
export const COUNSELLORS = ["Karthik Selvam", "Meena Kumari", "Rajesh Kannan", "Priya Raman"];
export const TRAINERS = ["Suresh Babu", "Anitha Joseph", "Vijay Anand", "Revathi Ganesh"];

export const employeeService = createCollection<Employee>("employees", () =>
  STAFF.map(([name, department, designation, salary], i) => ({
    id: `emp_${i + 1}`,
    employeeId: `YIT-${String(1001 + i)}`,
    name,
    email: `${name.split(" ")[0].toLowerCase()}@yaadhum.com`,
    phone: `+91 98${String(40000000 + i * 734521).slice(0, 8)}`,
    department,
    designation,
    joiningDate: daysFromToday(-(120 + i * 97)),
    salary,
    status: i === 10 ? "On Leave" : "Active",
  })),
);

export const departmentService = createCollection<Department>("departments", () =>
  DEPARTMENTS.map((name, i) => ({
    id: `dep_${i + 1}`,
    name,
    head: pick(["Suresh Babu", "Priya Raman", "Divya Lakshmi", "Arun Prakash", "Naveen Raj", "Keerthana S", "Santha Kumar"], i),
    location: i % 2 === 0 ? "Chennai HQ" : "Coimbatore Branch",
    description: `${name} team at Yaadhum International Technologies.`,
  })),
);

export const performanceService = createCollection<PerformanceReview>("performance", () =>
  STAFF.slice(1, 13).map(([name], i) => ({
    id: `prf_${i + 1}`,
    employeeName: name,
    period: i % 3 === 0 ? "Q2 2026" : "Q3 2026",
    rating: [4.5, 4, 3.5, 5, 3, 4, 4.5, 3.5, 4, 5, 3, 4][i],
    goalsMet: [92, 80, 70, 100, 60, 85, 90, 72, 78, 98, 55, 82][i],
    reviewer: i < 4 ? "Santha Kumar" : "Priya Raman",
    status: i % 4 === 3 ? "Pending" : i % 5 === 4 ? "Draft" : "Completed",
    comments: "Consistent contributor. Focus on mentoring juniors next quarter.",
  })),
);

export async function getEmployeeOptions() {
  const rows = await employeeService.list();
  return rows.map((e) => e.name);
}

export async function getDepartmentOptions() {
  const rows = await departmentService.list();
  return rows.map((d) => d.name);
}
