"use client";

import { AlertTriangle, CircleDollarSign, IndianRupee, Wallet } from "lucide-react";
import type { FeeAccount } from "@/types/payment";
import { feeService, feeStatus } from "@/services/paymentService";
import { COURSE_NAMES, getCourseOptions } from "@/services/courseService";
import { getStudentOptions } from "@/services/studentService";
import { daysFromToday, formatCompact, sum, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Money, PersonCell, Progress } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";
import { CollectFeeButton } from "./CollectFeeButton";

const STATUSES = ["Paid", "Partial", "Unpaid", "Overdue"];
export const balanceOf = (f: FeeAccount) => Math.max(0, f.totalFee - f.discount - f.paid);

export const feeConfig: ResourceConfig<FeeAccount> = {
  entityName: "Fee account",
  module: "fees",
  service: feeService,
  basePath: "/fees",
  fields: [
    { name: "studentName", label: "Student", type: "select", required: true, optionsLoader: getStudentOptions },
    { name: "course", label: "Course", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "totalFee", label: "Total fee (₹)", type: "number", required: true, min: 0 },
    { name: "discount", label: "Discount / scholarship (₹)", type: "number", min: 0 },
    { name: "paid", label: "Paid so far (₹)", type: "number", min: 0 },
    { name: "installments", label: "Installments", type: "number", min: 1, max: 12 },
    { name: "dueDate", label: "Next due date", type: "date", required: true },
  ],
  defaults: () => ({ discount: 0, paid: 0, installments: 3, dueDate: daysFromToday(30) }),
  beforeSave: (v) =>
    ({
      status: feeStatus({
        totalFee: Number(v.totalFee),
        discount: Number(v.discount || 0),
        paid: Number(v.paid || 0),
        dueDate: String(v.dueDate),
      }),
    }) as Partial<FeeAccount>,
};

export function FeesView() {
  const today = todayISO();
  return (
    <ResourcePage<FeeAccount>
      {...feeConfig}
      title="Fees"
      description="Student fee accounts, balances and due dates."
      searchKeys={["studentName", "course"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "course", label: "Courses", options: COURSE_NAMES },
      ]}
      stats={(rows) => [
        { label: "Total Billed", value: formatCompact(sum(rows, (r) => r.totalFee - r.discount)), icon: Wallet },
        { label: "Collected", value: formatCompact(sum(rows, (r) => r.paid)), icon: IndianRupee, accent: "ember" },
        { label: "Outstanding", value: formatCompact(sum(rows, balanceOf)), icon: CircleDollarSign, accent: "cream" },
        { label: "Overdue Accounts", value: rows.filter((r) => balanceOf(r) > 0 && r.dueDate < today).length, icon: AlertTriangle, accent: "dark" },
      ]}
      columns={[
        { key: "studentName", header: "Student", render: (r) => <PersonCell name={r.studentName} sub={r.course} /> },
        { key: "totalFee", header: "Net fee", render: (r) => <Money value={r.totalFee - r.discount} />, sortValue: (r) => r.totalFee - r.discount },
        { key: "paid", header: "Paid", render: (r) => <span className="text-emerald-700"><Money value={r.paid} /></span>, hideBelow: "md" },
        { key: "balance", header: "Balance", render: (r) => <Money value={balanceOf(r)} strong />, sortValue: balanceOf },
        { key: "progress", header: "Progress", render: (r) => <Progress value={r.paid} max={r.totalFee - r.discount} />, sortable: false, hideBelow: "lg" },
        { key: "dueDate", header: "Due", render: (r) => <span className={balanceOf(r) > 0 && r.dueDate < today ? "font-semibold text-brand-700" : ""}>{new Date(r.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>, hideBelow: "sm" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(row, { canEdit }) => (canEdit ? <CollectFeeButton fee={row} /> : null)}
    />
  );
}
