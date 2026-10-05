"use client";

import Link from "next/link";
import { BookOpen, CircleDollarSign, FileText, IndianRupee, Layers, Receipt, Wallet } from "lucide-react";
import type { Student } from "@/types/student";
import { admissionService } from "@/services/admissionService";
import { batchService } from "@/services/batchService";
import { courseService } from "@/services/courseService";
import { documentService } from "@/services/documentService";
import { feeService, paymentService } from "@/services/paymentService";
import { useResource } from "@/hooks/useResource";
import { formatCompact, formatCurrency, formatDate, sum } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { CollectFeeButton } from "@/components/payments/CollectFeeButton";
import { ReportButton } from "@/components/reports/PersonReport";
import { studentConfig } from "./StudentsView";

function useStudentFinance(name: string) {
  const fee = useResource(feeService).data.find((f) => f.studentName === name);
  const payments = useResource(paymentService).data.filter((p) => p.studentName === name);
  return { fee, payments };
}

function StudentMain({ student }: { student: Student }) {
  const { fee, payments } = useStudentFinance(student.name);
  const documents = useResource(documentService).data.filter((d) => d.relatedTo === student.name);
  const net = fee ? fee.totalFee - fee.discount : 0;
  return (
    <>
      <Card>
        <CardHeader title="Fee account" action={fee && <CollectFeeButton fee={fee} />} />
        {fee ? (
          <div className="p-5">
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total fee", value: formatCurrency(fee.totalFee) },
                { label: "Discount", value: formatCurrency(fee.discount) },
                { label: "Paid", value: formatCurrency(fee.paid), cls: "text-emerald-700" },
                { label: "Balance", value: formatCurrency(Math.max(0, net - fee.paid)), cls: "text-brand-700" },
              ].map((i) => (
                <div key={i.label}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{i.label}</p>
                  <p className={`font-display text-xl font-bold ${i.cls ?? "text-ink-900"}`}>{i.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4">
              <Progress value={fee.paid} max={net} />
              <div className="flex items-center gap-2 text-xs text-stone-500">
                Next due {formatDate(fee.dueDate)} <StatusBadge status={fee.status} />
              </div>
            </div>
            <Link href={`/fees/${fee.id}`} className="mt-3 inline-block text-xs font-semibold text-brand-700">
              Open fee account →
            </Link>
          </div>
        ) : (
          <p className="p-5 text-sm text-stone-500">No fee account created for this student.</p>
        )}
      </Card>

      <RelatedCard title="Payments" count={payments.length} empty="No payments recorded.">
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
            sub={`${p.mode} · ${formatDate(p.date)}`}
            trailing={<StatusBadge status={p.status} />}
          />
        ))}
      </RelatedCard>

      <RelatedCard title="Documents" count={documents.length} empty="No documents uploaded for this student.">
        {documents.map((d) => (
          <RelatedRow
            key={d.id}
            href={`/documents/${d.id}`}
            leading={
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <FileText className="h-4 w-4" />
              </span>
            }
            title={d.name}
            sub={`${d.category} · ${d.fileType}`}
            trailing={<StatusBadge status={d.status} />}
          />
        ))}
      </RelatedCard>
    </>
  );
}

function StudentAside({ student }: { student: Student }) {
  const batch = useResource(batchService).data.find((b) => b.name === student.batch);
  const course = useResource(courseService).data.find((c) => c.name === student.course);
  const application = useResource(admissionService).data.find((a) => a.studentName === student.name);
  return (
    <>
      <Card>
        <CardHeader title="Batch" />
        {batch ? (
          <>
            <Link href={`/batches/${batch.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <Layers className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{batch.name}</p>
                <p className="text-xs text-stone-500">{batch.timing}</p>
              </div>
              <StatusBadge status={batch.status} />
            </Link>
            <InfoList
              items={[
                { label: "Trainer", value: batch.trainer },
                { label: "Starts", value: formatDate(batch.startDate) },
                { label: "Ends", value: formatDate(batch.endDate) },
              ]}
            />
          </>
        ) : (
          <p className="p-5 text-sm text-stone-500">{student.batch}</p>
        )}
      </Card>
      {course && (
        <Card>
          <CardHeader title="Course" />
          <Link href={`/courses/${course.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink-900">{course.name}</p>
              <p className="text-xs text-stone-500">
                {course.code} · {course.durationMonths} months · {course.mode}
              </p>
            </div>
          </Link>
        </Card>
      )}
      {application && (
        <RelatedCard title="Admission">
          <RelatedRow href={`/admissions/${application.id}`} title={application.applicationNo} sub={`Applied ${formatDate(application.appliedOn)}`} trailing={<StatusBadge status={application.status} />} />
        </RelatedCard>
      )}
    </>
  );
}

export function StudentDetail({ id }: { id: string }) {
  return (
    <DetailPage<Student>
      {...studentConfig}
      basePath="/students"
      id={id}
      listLabel="Students"
      avatar="person"
      title={(r) => r.name}
      subtitle={(r) => `${r.studentId} · ${r.course}`}
      status={(r) => r.status}
      contact={(r) => ({ email: r.email, phone: r.phone })}
      sections={[
        { title: "Personal information", items: ["name", "studentId", "email", "phone", "city"] },
        { title: "Academic information", items: ["course", "batch", "enrollmentDate", "status"] },
        { title: "Guardian", items: ["guardianName", "guardianPhone"] },
      ]}
      actions={(r) => <ReportButton href={`/students/${r.id}/report`} />}
      main={(r) => <StudentMain student={r} />}
      aside={(r) => (
        <>
          <StudentFinanceSummary name={r.name} />
          <StudentAside student={r} />
        </>
      )}
    />
  );
}

function StudentFinanceSummary({ name }: { name: string }) {
  const { fee, payments } = useStudentFinance(name);
  const paid = sum(payments.filter((p) => p.status === "Success"), (p) => p.amount);
  const balance = fee ? Math.max(0, fee.totalFee - fee.discount - fee.paid) : 0;
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Net fee", value: formatCompact(fee ? fee.totalFee - fee.discount : 0), icon: Wallet },
        { label: "Collected", value: formatCompact(paid), icon: IndianRupee },
        { label: "Balance", value: formatCompact(balance), icon: CircleDollarSign },
        { label: "Receipts", value: payments.length, icon: Receipt },
      ].map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-2xl border border-brand-100/70 bg-white p-4">
          <Icon className="h-4 w-4 text-brand-600" />
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
          <p className="font-display text-lg font-bold text-ink-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
