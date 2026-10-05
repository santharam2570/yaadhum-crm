"use client";

import Image from "next/image";
import { BadgeIndianRupee, CheckCircle2, Printer, Wallet } from "lucide-react";
import type { Payroll } from "@/types/payroll";
import { employeeService } from "@/services/employeeService";
import { payrollService } from "@/services/payrollService";
import { useResource } from "@/hooks/useResource";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow, StatusStepper } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { HR_CRUMBS } from "@/components/hr/employees/EmployeesView";
import { advancePayroll, payrollConfig } from "./PayrollView";

function Payslip({ row }: { row: Payroll }) {
  const emp = useResource(employeeService).data.find((e) => e.name === row.employeeName);
  const gross = row.basic + row.allowances;
  const lines = [
    { label: "Basic salary", earn: row.basic },
    { label: "Allowances (HRA, conveyance, special)", earn: row.allowances },
    { label: "Deductions (PF, ESI, TDS, advances)", deduct: row.deductions },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="bg-sidebar flex items-center gap-4 p-5 text-white">
        <Image src="/logo-mark.jpg" alt="Yaadhum" width={52} height={52} className="logo-ring rounded-full" />
        <div className="flex-1">
          <p className="font-display text-lg font-bold tracking-[0.15em]">YAADHUM INTERNATIONAL</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-brand-300">Technologies · Payslip</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-brand-300">Pay period</p>
          <p className="font-display text-lg font-bold">{row.month}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-b border-brand-50 p-5 text-sm sm:grid-cols-4">
        {[
          { label: "Employee", value: row.employeeName },
          { label: "Employee ID", value: emp?.employeeId ?? "—" },
          { label: "Department", value: row.department },
          { label: "Designation", value: emp?.designation ?? "—" },
        ].map((i) => (
          <div key={i.label}>
            <p className="text-[11px] uppercase tracking-wider text-stone-500">{i.label}</p>
            <p className="font-semibold text-ink-900">{i.value}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-2 text-left">Component</th>
            <th className="px-5 py-2 text-right">Earnings</th>
            <th className="px-5 py-2 text-right">Deductions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {lines.map((l) => (
            <tr key={l.label}>
              <td className="px-5 py-2.5">{l.label}</td>
              <td className="px-5 py-2.5 text-right">{l.earn !== undefined ? formatCurrency(l.earn) : ""}</td>
              <td className="px-5 py-2.5 text-right text-brand-700">{l.deduct !== undefined ? formatCurrency(l.deduct) : ""}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="px-5 py-2.5">Total</td>
            <td className="px-5 py-2.5 text-right">{formatCurrency(gross)}</td>
            <td className="px-5 py-2.5 text-right text-brand-700">{formatCurrency(row.deductions)}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-dashed border-brand-200 bg-glow px-5 py-4">
        <div className="text-xs text-stone-600">
          <StatusBadge status={row.status} />
          {row.paidOn && <p className="mt-1">Paid on {formatDate(row.paidOn)}</p>}
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-brand-800">Net pay</p>
          <p className="font-display text-3xl font-bold text-brand-700">{formatCurrency(row.netPay)}</p>
        </div>
      </div>
    </Card>
  );
}

function PayHistory({ row }: { row: Payroll }) {
  const others = useResource(payrollService).data.filter((p) => p.employeeName === row.employeeName && p.id !== row.id);
  return (
    <RelatedCard title="Other payslips" count={others.length} empty="No other payslips for this employee.">
      {others.map((p) => (
        <RelatedRow key={p.id} href={`/hr/payroll/${p.id}`} leading={<Wallet className="h-4 w-4 text-brand-600" />} title={p.month} sub={formatCurrency(p.netPay)} trailing={<StatusBadge status={p.status} />} />
      ))}
    </RelatedCard>
  );
}

export function PayrollDetail({ id }: { id: string }) {
  return (
    <DetailPage<Payroll>
      {...payrollConfig}
      basePath="/hr/payroll"
      parents={HR_CRUMBS}
      id={id}
      listLabel="Payroll"
      avatar={BadgeIndianRupee}
      title={(p) => `${p.employeeName} — ${p.month}`}
      subtitle={(p) => `${p.department} · Net pay ${formatCurrency(p.netPay)}`}
      status={(p) => p.status}
      sections={[
        { title: "Payslip", items: ["employeeName", "department", "month", "status", { key: "paidOn", label: "Paid on", type: "date" }] },
        { title: "Salary breakdown", items: ["basic", "allowances", "deductions", { key: "netPay", label: "Net pay", type: "money" }] },
      ]}
      actions={(p, ctx) => (
        <>
          <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print
          </Button>
          {ctx.canEdit && p.status !== "Paid" && (
            <Button
              variant="dark"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={async () => {
                const next = await advancePayroll(p);
                ctx.toast(`Payslip ${next.toLowerCase()}`);
              }}
            >
              {p.status === "Pending" ? "Process" : "Mark paid"}
            </Button>
          )}
        </>
      )}
      main={(p) => (
        <>
          <Card>
            <CardHeader title="Processing" />
            <div className="p-5">
              <StatusStepper steps={["Pending", "Processed", "Paid"]} current={p.status} />
            </div>
          </Card>
          <Payslip row={p} />
        </>
      )}
      aside={(p) => (
        <>
          <EmployeeLinkCard title="Employee" name={p.employeeName} />
          <PayHistory row={p} />
        </>
      )}
    />
  );
}
