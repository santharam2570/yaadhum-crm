"use client";

import { Banknote, Clock, IndianRupee, Wallet } from "lucide-react";
import type { Payroll } from "@/types/payroll";
import { computeNetPay, PAYROLL_MONTHS, payrollService } from "@/services/payrollService";
import { DEPARTMENTS, getEmployeeOptions } from "@/services/employeeService";
import { formatCompact, sum, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { ActionChip, Money, PersonCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const STATUSES = ["Pending", "Processed", "Paid"];

export const payrollConfig: ResourceConfig<Payroll> = {
  entityName: "Payslip",
  module: "hr",
  service: payrollService,
  basePath: "/hr/payroll",
  fields: [
    { name: "employeeName", label: "Employee", type: "select", required: true, optionsLoader: getEmployeeOptions },
    { name: "department", label: "Department", type: "select", required: true, options: DEPARTMENTS },
    { name: "month", label: "Month", type: "select", required: true, options: PAYROLL_MONTHS },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "basic", label: "Basic (₹)", type: "number", required: true, min: 0 },
    { name: "allowances", label: "Allowances (₹)", type: "number", min: 0 },
    { name: "deductions", label: "Deductions (₹)", type: "number", min: 0, hint: "PF, ESI, TDS, advances" },
  ],
  defaults: () => ({ month: PAYROLL_MONTHS[PAYROLL_MONTHS.length - 1], status: "Pending", allowances: 0, deductions: 0 }),
  beforeSave: (v) => ({
    netPay: computeNetPay(Number(v.basic), Number(v.allowances), Number(v.deductions)),
    paidOn: v.status === "Paid" ? ((v.paidOn as string) || todayISO()) : undefined,
  }),
  onStatusChange: (row, status) =>
    payrollService.update(row.id, { status: status as Payroll["status"], paidOn: status === "Paid" ? (row.paidOn ?? todayISO()) : undefined }),
};

/** Moves a payslip one step along Pending → Processed → Paid. */
export async function advancePayroll(row: Payroll) {
  const next = row.status === "Pending" ? "Processed" : "Paid";
  await payrollService.update(row.id, { status: next, paidOn: next === "Paid" ? todayISO() : undefined });
  return next;
}

export function PayrollView() {
  return (
    <ResourcePage<Payroll>
      {...payrollConfig}
      title="Payroll"
      description="Monthly salary processing with allowances and deductions."
      breadcrumbs={[{ label: "HR", href: "/hr" }, { label: "Payroll" }]}
      searchKeys={["employeeName", "department", "month"]}
      filters={[
        { key: "month", label: "Months", options: PAYROLL_MONTHS },
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "department", label: "Departments", options: DEPARTMENTS },
      ]}
      stats={(rows) => {
        const current = rows.filter((r) => r.month === PAYROLL_MONTHS[PAYROLL_MONTHS.length - 1]);
        return [
          { label: "This Month Net", value: formatCompact(sum(current, (r) => r.netPay)), icon: Wallet, hint: PAYROLL_MONTHS[PAYROLL_MONTHS.length - 1] },
          { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, icon: Clock, accent: "ember" },
          { label: "Deductions", value: formatCompact(sum(current, (r) => r.deductions)), icon: Banknote, accent: "cream" },
          { label: "Paid (All)", value: formatCompact(sum(rows.filter((r) => r.status === "Paid"), (r) => r.netPay)), icon: IndianRupee, accent: "dark" },
        ];
      }}
      columns={[
        { key: "employeeName", header: "Employee", render: (r) => <PersonCell name={r.employeeName} sub={r.department} /> },
        { key: "month", header: "Month" },
        { key: "basic", header: "Basic", render: (r) => <Money value={r.basic} />, hideBelow: "lg" },
        { key: "allowances", header: "Allowances", render: (r) => <Money value={r.allowances} />, hideBelow: "lg" },
        { key: "deductions", header: "Deductions", render: (r) => <span className="text-brand-700">-<Money value={r.deductions} /></span>, hideBelow: "md" },
        { key: "netPay", header: "Net pay", render: (r) => <Money value={r.netPay} strong /> },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(row, { toast, canEdit }) =>
        canEdit && row.status !== "Paid" ? (
          <ActionChip
            label={row.status === "Pending" ? "Process" : "Mark paid"}
            tone={row.status === "Pending" ? "brand" : "green"}
            onClick={async () => {
              const next = await advancePayroll(row);
              toast(`Payslip for ${row.employeeName} ${next.toLowerCase()}`);
            }}
          />
        ) : null
      }
    />
  );
}
