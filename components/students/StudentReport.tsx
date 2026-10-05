"use client";

import { batchService } from "@/services/batchService";
import { courseService } from "@/services/courseService";
import { documentService } from "@/services/documentService";
import { onboardingService } from "@/services/onboardingService";
import { feeService, paymentService } from "@/services/paymentService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { formatCurrency, formatDate, sum } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { ReportFields, ReportSection, ReportShell, ReportTable, ReportTiles } from "@/components/reports/PersonReport";

export function StudentReport({ id }: { id: string }) {
  const students = useResource(studentService);
  const fees = useResource(feeService).data;
  const payments = useResource(paymentService).data;
  const documents = useResource(documentService).data;
  const batches = useResource(batchService).data;
  const courses = useResource(courseService).data;
  const onboarding = useResource(onboardingService).data;

  const s = students.data.find((r) => r.id === id);
  const fee = s && fees.find((f) => f.studentName === s.name);
  const paid = s ? payments.filter((p) => p.studentName === s.name).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const docs = s ? documents.filter((d) => d.relatedTo === s.name) : [];
  const batch = s && batches.find((b) => b.name === s.batch);
  const course = s && courses.find((c) => c.name === s.course);
  const onb = s && onboarding.find((o) => o.candidateName === s.name);
  const net = fee ? fee.totalFee - fee.discount : 0;

  return (
    <ReportShell
      kind="Student"
      name={s?.name}
      subtitle={s && `${s.studentId} · ${s.course}`}
      status={s?.status}
      backHref={`/students/${id}`}
      loading={students.loading}
      found={!!s}
    >
      {s && (
        <>
          <ReportTiles
            items={[
              { label: "Net fee", value: formatCurrency(net) },
              { label: "Collected", value: formatCurrency(sum(paid.filter((p) => p.status === "Success"), (p) => p.amount)), tone: "good" },
              { label: "Balance", value: formatCurrency(fee ? Math.max(0, net - fee.paid) : 0), tone: fee && net - fee.paid > 0 ? "bad" : undefined },
              { label: "Documents", value: `${docs.filter((d) => d.status === "Verified").length}/${docs.length} verified` },
            ]}
          />
          <ReportSection title="Personal information">
            <ReportFields
              items={[
                { label: "Full name", value: s.name },
                { label: "Student ID", value: s.studentId },
                { label: "Email", value: s.email },
                { label: "Phone", value: s.phone },
                { label: "City", value: s.city },
                { label: "Status", value: s.status },
              ]}
            />
          </ReportSection>
          <ReportSection title="Academic information">
            <ReportFields
              items={[
                { label: "Course", value: s.course },
                { label: "Duration", value: course && `${course.durationMonths} months · ${course.mode}` },
                { label: "Enrolled on", value: formatDate(s.enrollmentDate) },
                { label: "Batch", value: s.batch },
                { label: "Batch timing", value: batch?.timing },
                { label: "Trainer", value: batch?.trainer },
                { label: "Batch period", value: batch && `${formatDate(batch.startDate)} → ${formatDate(batch.endDate)}` },
                { label: "Onboarding", value: onb?.stage },
              ]}
            />
          </ReportSection>
          <ReportSection title="Guardian">
            <ReportFields
              items={[
                { label: "Guardian name", value: s.guardianName },
                { label: "Guardian phone", value: s.guardianPhone },
              ]}
            />
          </ReportSection>
          <ReportSection title="Fee account">
            {fee ? (
              <ReportFields
                items={[
                  { label: "Total fee", value: formatCurrency(fee.totalFee) },
                  { label: "Discount", value: formatCurrency(fee.discount) },
                  { label: "Net fee", value: formatCurrency(net) },
                  { label: "Paid", value: formatCurrency(fee.paid) },
                  { label: "Balance", value: formatCurrency(Math.max(0, net - fee.paid)) },
                  { label: "Installments", value: fee.installments },
                  { label: "Next due", value: formatDate(fee.dueDate) },
                  { label: "Fee status", value: <StatusBadge status={fee.status} /> },
                ]}
              />
            ) : (
              <p className="text-sm text-stone-500">No fee account.</p>
            )}
          </ReportSection>
          <ReportSection title={`Payments (${paid.length})`}>
            <ReportTable
              rows={paid}
              empty="No payments recorded."
              columns={[
                { header: "Receipt", cell: (p) => <span className="font-mono text-xs">{p.receiptNo}</span> },
                { header: "Date", cell: (p) => formatDate(p.date) },
                { header: "Mode", cell: (p) => p.mode },
                { header: "Reference", cell: (p) => p.reference || "—" },
                { header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
                { header: "Amount", cell: (p) => formatCurrency(p.amount), align: "right" },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Documents (${docs.length})`}>
            <ReportTable
              rows={docs}
              empty="No documents on file."
              columns={[
                { header: "Document", cell: (d) => d.name },
                { header: "Category", cell: (d) => d.category },
                { header: "Type", cell: (d) => d.fileType },
                { header: "Uploaded", cell: (d) => formatDate(d.uploadedOn) },
                { header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
              ]}
            />
          </ReportSection>
        </>
      )}
    </ReportShell>
  );
}
