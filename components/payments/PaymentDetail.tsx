"use client";

import Link from "next/link";
import { GraduationCap, Printer, Receipt, Wallet } from "lucide-react";
import type { Payment } from "@/types/payment";
import { feeService, paymentService } from "@/services/paymentService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { paymentConfig } from "./PaymentsView";
import { ReceiptCard } from "./ReceiptButton";

function PaymentAside({ row }: { row: Payment }) {
  const student = useResource(studentService).data.find((s) => s.name === row.studentName);
  const fee = useResource(feeService).data.find((f) => f.studentName === row.studentName);
  const others = useResource(paymentService).data.filter((p) => p.studentName === row.studentName && p.id !== row.id);
  const net = fee ? fee.totalFee - fee.discount : 0;
  return (
    <>
      <Card>
        <CardHeader title="Paid by" />
        {student ? (
          <Link href={`/students/${student.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
            <Avatar name={student.name} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-ink-900">{student.name}</p>
              <p className="text-xs text-stone-500">
                {student.studentId} · {student.batch}
              </p>
            </div>
            <GraduationCap className="h-4 w-4 text-brand-600" />
          </Link>
        ) : (
          <p className="p-5 text-sm text-stone-500">{row.studentName}</p>
        )}
      </Card>
      {fee && (
        <Card>
          <CardHeader
            title="Fee account"
            action={
              <Link href={`/fees/${fee.id}`} className="text-xs font-semibold text-brand-700">
                Open →
              </Link>
            }
          />
          <div className="px-5 pt-4">
            <Progress value={fee.paid} max={net} />
          </div>
          <InfoList
            items={[
              { label: "Net fee", value: formatCurrency(net) },
              { label: "Paid", value: formatCurrency(fee.paid) },
              { label: "Balance", value: formatCurrency(Math.max(0, net - fee.paid)) },
              { label: "Status", value: <StatusBadge status={fee.status} /> },
            ]}
          />
        </Card>
      )}
      <RelatedCard title="Other payments" count={others.length} empty="No other payments from this student.">
        {others.map((p) => (
          <RelatedRow key={p.id} href={`/payments/${p.id}`} leading={<Receipt className="h-4 w-4 text-brand-600" />} title={`${p.receiptNo} · ${formatCurrency(p.amount)}`} sub={`${p.mode} · ${formatDate(p.date)}`} trailing={<StatusBadge status={p.status} />} />
        ))}
      </RelatedCard>
    </>
  );
}

export function PaymentDetail({ id }: { id: string }) {
  return (
    <DetailPage<Payment>
      {...paymentConfig}
      basePath="/payments"
      id={id}
      listLabel="Payments"
      avatar={Wallet}
      title={(p) => `${p.receiptNo} · ${formatCurrency(p.amount)}`}
      subtitle={(p) => `${p.studentName} · ${p.course} · ${p.mode} · ${formatDate(p.date)}`}
      status={(p) => p.status}
      sections={[
        { title: "Transaction", items: ["receiptNo", "date", "amount", "mode", "reference", "status"] },
        { title: "Payer", items: ["studentName", "course"] },
      ]}
      actions={() => (
        <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Print receipt
        </Button>
      )}
      main={(p) => (
        <Card>
          <CardHeader title="Receipt" />
          <div className="p-5">
            <ReceiptCard payment={p} />
          </div>
        </Card>
      )}
      aside={(p) => <PaymentAside row={p} />}
    />
  );
}
