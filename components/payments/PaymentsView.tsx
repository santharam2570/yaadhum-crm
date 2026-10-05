"use client";

import { CheckCircle2, Clock, IndianRupee, Receipt } from "lucide-react";
import type { Payment } from "@/types/payment";
import { paymentService, PAYMENT_MODES } from "@/services/paymentService";
import { getCourseOptions } from "@/services/courseService";
import { getStudentOptions } from "@/services/studentService";
import { logActivity } from "@/services/followupService";
import { formatCompact, formatCurrency, monthKey, sum, todayISO } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { DateText, Money, PersonCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";
import { ReceiptButton } from "./ReceiptButton";

const STATUSES = ["Success", "Pending", "Failed", "Refunded"];

export const paymentConfig: ResourceConfig<Payment> = {
  entityName: "Payment",
  module: "payments",
  service: paymentService,
  basePath: "/payments",
  fields: [
    { name: "receiptNo", label: "Receipt no.", required: true },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "studentName", label: "Student", type: "select", required: true, optionsLoader: getStudentOptions },
    { name: "course", label: "Course", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 1 },
    { name: "mode", label: "Mode", type: "select", required: true, options: PAYMENT_MODES },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "reference", label: "Reference / UTR" },
  ],
  defaults: () => ({
    receiptNo: `RCPT-${Math.floor(2000 + Math.random() * 7000)}`,
    date: todayISO(),
    mode: "UPI",
    status: "Success",
  }),
};

export function PaymentsView() {
  const thisMonth = monthKey(todayISO());
  return (
    <ResourcePage<Payment>
      {...paymentConfig}
      title="Payments"
      description="Every fee transaction with printable receipts."
      searchKeys={["receiptNo", "studentName", "course", "reference"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "mode", label: "Modes", options: PAYMENT_MODES },
      ]}
      stats={(rows) => {
        const ok = rows.filter((r) => r.status === "Success");
        return [
          { label: "Collected (All)", value: formatCompact(sum(ok, (r) => r.amount)), icon: IndianRupee },
          { label: "This Month", value: formatCompact(sum(ok.filter((r) => monthKey(r.date) === thisMonth), (r) => r.amount)), icon: CheckCircle2, accent: "ember" },
          { label: "Transactions", value: rows.length, icon: Receipt, accent: "cream" },
          { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, icon: Clock, accent: "dark" },
        ];
      }}
      columns={[
        { key: "receiptNo", header: "Receipt", render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.receiptNo}</span> },
        { key: "studentName", header: "Student", render: (r) => <PersonCell name={r.studentName} sub={r.course} /> },
        { key: "amount", header: "Amount", render: (r) => <Money value={r.amount} strong /> },
        { key: "mode", header: "Mode", render: (r) => <Badge tone="blue">{r.mode}</Badge>, hideBelow: "md" },
        { key: "date", header: "Date", render: (r) => <DateText value={r.date} />, hideBelow: "sm" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      afterCreate={(row) =>
        row.status === "Success" &&
        logActivity("payment", "Payment received", `${formatCurrency(row.amount)} received from ${row.studentName} via ${row.mode}.`)
      }
      rowActions={(row) => <ReceiptButton payment={row} />}
    />
  );
}
