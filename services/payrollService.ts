import { createCollection } from "@/lib/api";
import { toISODate } from "@/lib/utils";
import type { Payroll } from "@/types/payroll";

const STAFF: [string, string, number][] = [
  ["Priya Raman", "Sales & Admissions", 75000],
  ["Karthik Selvam", "Sales & Admissions", 42000],
  ["Meena Kumari", "Sales & Admissions", 32000],
  ["Rajesh Kannan", "Sales & Admissions", 30000],
  ["Divya Lakshmi", "Human Resources", 38000],
  ["Arun Prakash", "Finance", 40000],
  ["Suresh Babu", "Academics", 68000],
  ["Anitha Joseph", "Academics", 72000],
  ["Vijay Anand", "Academics", 60000],
  ["Revathi Ganesh", "Academics", 52000],
  ["Naveen Raj", "Marketing", 55000],
  ["Keerthana S", "Technology", 48000],
  ["Mani Bharathi", "Operations", 22000],
];

function monthLabel(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function computeNetPay(basic: number, allowances: number, deductions: number) {
  return Math.max(0, Number(basic || 0) + Number(allowances || 0) - Number(deductions || 0));
}

export const payrollService = createCollection<Payroll>("payroll", () => {
  const rows: Payroll[] = [];
  [-2, -1, 0].forEach((offset) => {
    STAFF.forEach(([employeeName, department, gross], i) => {
      const basic = Math.round(gross * 0.6);
      const allowances = Math.round(gross * 0.4);
      const deductions = Math.round(gross * 0.12) + (i % 4 === 0 ? 1500 : 0);
      const paidOn = new Date();
      paidOn.setDate(1);
      paidOn.setMonth(paidOn.getMonth() + offset + 1);
      rows.push({
        id: `pay_${offset + 3}_${i + 1}`,
        employeeName,
        department,
        month: monthLabel(offset),
        basic,
        allowances,
        deductions,
        netPay: computeNetPay(basic, allowances, deductions),
        status: offset < 0 ? "Paid" : i % 3 === 0 ? "Processed" : "Pending",
        paidOn: offset < 0 ? toISODate(paidOn) : undefined,
      });
    });
  });
  return rows;
});

export const PAYROLL_MONTHS = [monthLabel(-2), monthLabel(-1), monthLabel(0)];
