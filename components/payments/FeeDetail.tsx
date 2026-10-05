"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, CircleDollarSign, IndianRupee, Receipt, Wallet } from "lucide-react";
import type { FeeAccount } from "@/types/payment";
import { courseService } from "@/services/courseService";
import { paymentService } from "@/services/paymentService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { cn, daysBetween, formatCompact, formatCurrency, formatDate, toISODate, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { CollectFeeButton } from "./CollectFeeButton";
import { balanceOf, feeConfig } from "./FeesView";

/** Splits the net fee into equal monthly installments; the first unpaid one falls on the account's next due date. */
function schedule(f: FeeAccount) {
  const n = Math.max(1, f.installments || 1);
  const net = f.totalFee - f.discount;
  const each = Math.round(net / n);
  let covered = f.paid;
  const rows = Array.from({ length: n }, (_, i) => {
    const amount = i === n - 1 ? net - each * (n - 1) : each;
    const paid = Math.min(amount, Math.max(0, covered));
    covered -= amount;
    return { no: i + 1, amount, paid, due: "" };
  });
  const current = Math.max(0, rows.findIndex((r) => r.paid < r.amount));
  rows.forEach((r, i) => {
    const d = new Date(f.dueDate);
    d.setMonth(d.getMonth() + i - current);
    r.due = toISODate(d);
  });
  return rows;
}

function FeeMain({ fee }: { fee: FeeAccount }) {
  const payments = useResource(paymentService).data.filter((p) => p.studentName === fee.studentName);
  const today = todayISO();
  return (
    <>
      <Card>
        <CardHeader title="Installment schedule" description={`${fee.installments} installment${fee.installments > 1 ? "s" : ""}`} />
        <ul className="divide-y divide-brand-50">
          {schedule(fee).map((s) => {
            const done = s.paid >= s.amount;
            const late = !done && s.due < today;
            return (
              <li key={s.no} className="flex items-center gap-4 px-5 py-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done ? "bg-emerald-50 text-emerald-700" : late ? "bg-brand-50 text-brand-700" : "bg-cream-100 text-brand-800",
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : s.no}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">Installment {s.no}</p>
                  <p className="text-xs text-stone-500">Due {formatDate(s.due)}</p>
                </div>
                <div className="w-28">
                  <Progress value={s.paid} max={s.amount} />
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-semibold">{formatCurrency(s.amount)}</p>
                  <StatusBadge status={done ? "Paid" : s.paid > 0 ? "Partial" : late ? "Overdue" : "Unpaid"} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <RelatedCard title="Payments received" count={payments.length} empty="No payments yet.">
        {payments.map((p) => (
          <RelatedRow
            key={p.id}
            href={`/payments/${p.id}`}
            leading={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Receipt className="h-4 w-4" />
              </span>
            }
            title={`${p.receiptNo} · ${formatCurrency(p.amount)}`}
            sub={`${p.mode} · ${formatDate(p.date)}${p.reference ? ` · ${p.reference}` : ""}`}
            trailing={<StatusBadge status={p.status} />}
          />
        ))}
      </RelatedCard>
    </>
  );
}

function FeeAside({ fee }: { fee: FeeAccount }) {
  const student = useResource(studentService).data.find((s) => s.name === fee.studentName);
  const course = useResource(courseService).data.find((c) => c.name === fee.course);
  const net = fee.totalFee - fee.discount;
  return (
    <>
      <Card>
        <CardHeader title="Student" />
        {student ? (
          <Link href={`/students/${student.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
            <Avatar name={student.name} size="lg" />
            <div>
              <p className="font-semibold text-ink-900">{student.name}</p>
              <p className="text-xs text-stone-500">
                {student.studentId} · {student.phone}
              </p>
            </div>
          </Link>
        ) : (
          <p className="p-5 text-sm text-stone-500">{fee.studentName}</p>
        )}
      </Card>
      <Card>
        <CardHeader title="Collection" />
        <div className="bg-glow p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800">Collected</p>
          <p className="font-display text-3xl font-bold text-brand-700">{net ? Math.round((fee.paid / net) * 100) : 0}%</p>
          <div className="mt-2">
            <Progress value={fee.paid} max={net} />
          </div>
        </div>
        <InfoList
          items={[
            { label: "Course", value: course ? <Link href={`/courses/${course.id}`} className="text-brand-700">{course.name}</Link> : fee.course },
            { label: "Discount", value: `${formatCurrency(fee.discount)} (${fee.totalFee ? Math.round((fee.discount / fee.totalFee) * 100) : 0}%)` },
            { label: "Per installment", value: formatCurrency(Math.round(net / Math.max(1, fee.installments))) },
          ]}
        />
      </Card>
    </>
  );
}

export function FeeDetail({ id }: { id: string }) {
  return (
    <DetailPage<FeeAccount>
      {...feeConfig}
      basePath="/fees"
      id={id}
      listLabel="Fees"
      avatar={Wallet}
      title={(f) => f.studentName}
      subtitle={(f) => `${f.course} · Balance ${formatCurrency(balanceOf(f))}`}
      status={(f) => f.status}
      sections={[
        { title: "Account", items: ["studentName", "course", "status", "installments", "dueDate"] },
        { title: "Amounts", items: ["totalFee", "discount", { key: "net", label: "Net fee", render: (f) => formatCurrency(f.totalFee - f.discount) }, "paid", { key: "balance", label: "Balance", render: (f) => <b className="text-brand-700">{formatCurrency(balanceOf(f))}</b> }] },
      ]}
      stats={(f) => {
        const today = todayISO();
        const overdue = balanceOf(f) > 0 && f.dueDate < today;
        return [
          { label: "Net fee", value: formatCompact(f.totalFee - f.discount), icon: Wallet },
          { label: "Paid", value: formatCompact(f.paid), icon: IndianRupee, accent: "ember" },
          { label: "Balance", value: formatCompact(balanceOf(f)), icon: CircleDollarSign, accent: "cream" },
          {
            label: overdue ? "Overdue by" : "Next due",
            value: balanceOf(f) === 0 ? "Settled" : overdue ? `${daysBetween(f.dueDate, today) - 1} days` : formatDate(f.dueDate, { day: "2-digit", month: "short" }),
            icon: CalendarClock,
            accent: "dark",
          },
        ];
      }}
      actions={(f, ctx) => (ctx.canEdit ? <CollectFeeButton fee={f} variant="button" /> : null)}
      main={(f) => <FeeMain fee={f} />}
      aside={(f) => <FeeAside fee={f} />}
    />
  );
}
