"use client";

import { BadgeCheck, Briefcase, FileText, GraduationCap, UserPlus, XCircle } from "lucide-react";
import type { CrmDocument } from "@/types/document";
import { documentService } from "@/services/documentService";
import { employeeService } from "@/services/employeeService";
import { logActivity } from "@/services/followupService";
import { leadService } from "@/services/leadService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { daysBetween, formatDate, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { documentConfig, formatSize } from "./DocumentsView";

function LinkedRecord({ name }: { name: string }) {
  const student = useResource(studentService).data.find((s) => s.name === name);
  const employee = useResource(employeeService).data.find((e) => e.name === name);
  const lead = useResource(leadService).data.find((l) => l.name === name);
  const links = [
    student && <RelatedRow key="s" href={`/students/${student.id}`} leading={<GraduationCap className="h-4 w-4 text-brand-600" />} title={student.name} sub={`Student · ${student.studentId}`} />,
    employee && <RelatedRow key="e" href={`/hr/employees/${employee.id}`} leading={<Briefcase className="h-4 w-4 text-brand-600" />} title={employee.name} sub={`Employee · ${employee.designation}`} />,
    lead && <RelatedRow key="l" href={`/leads/${lead.id}`} leading={<UserPlus className="h-4 w-4 text-brand-600" />} title={lead.name} sub={`Lead · ${lead.status}`} />,
  ].filter(Boolean);
  return (
    <RelatedCard title="Related to" empty={name && name !== "—" ? `${name} — no matching CRM record.` : "Not linked to any record."}>
      {links}
    </RelatedCard>
  );
}

function SameOwner({ row }: { row: CrmDocument }) {
  const docs = useResource(documentService).data.filter((d) => d.relatedTo === row.relatedTo && d.id !== row.id && row.relatedTo !== "—");
  return (
    <RelatedCard title="Other documents for this record" count={docs.length} empty="No other documents.">
      {docs.map((d) => (
        <RelatedRow
          key={d.id}
          href={`/documents/${d.id}`}
          leading={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700">{d.fileType}</span>
          }
          title={d.name}
          sub={`${d.category} · ${formatDate(d.uploadedOn)}`}
          trailing={<StatusBadge status={d.status} />}
        />
      ))}
    </RelatedCard>
  );
}

export function DocumentDetail({ id }: { id: string }) {
  return (
    <DetailPage<CrmDocument>
      {...documentConfig}
      basePath="/documents"
      id={id}
      listLabel="Documents"
      avatar={FileText}
      title={(d) => d.name}
      subtitle={(d) => `${d.category} · ${d.fileType} · ${formatSize(d.sizeKb)}`}
      status={(d) => d.status}
      sections={[
        { title: "File", items: ["name", "fileType", { key: "sizeKb", label: "Size", render: (d) => formatSize(d.sizeKb) }, "category"] },
        { title: "Ownership & status", items: ["relatedTo", "uploadedBy", { key: "uploadedOn", label: "Uploaded on", type: "date" }, "status"] },
      ]}
      actions={(d, ctx) =>
        ctx.canEdit && d.status !== "Verified" ? (
          <Button
            variant="dark"
            icon={<BadgeCheck className="h-4 w-4" />}
            onClick={async () => {
              await ctx.update({ status: "Verified" });
              await logActivity("document", "Document verified", `${d.name} was verified.`);
              ctx.toast("Document verified");
            }}
          >
            Verify
          </Button>
        ) : ctx.canEdit ? (
          <Button variant="secondary" icon={<XCircle className="h-4 w-4" />} onClick={() => ctx.update({ status: "Expired" })}>
            Mark expired
          </Button>
        ) : null
      }
      main={(d) => (
        <>
          <Card>
            <CardHeader title="Preview" />
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-24 w-20 items-center justify-center rounded-xl bg-brand-gradient font-display text-xl font-bold text-white shadow-lg">{d.fileType}</span>
              <p className="font-semibold text-ink-900">{d.name}</p>
              <p className="text-xs text-stone-500">
                {formatSize(d.sizeKb)} · uploaded {daysBetween(d.uploadedOn, todayISO()) - 1} days ago
              </p>
            </div>
          </Card>
          <SameOwner row={d} />
        </>
      )}
      aside={(d) => (
        <>
          <LinkedRecord name={d.relatedTo} />
          <EmployeeLinkCard title="Uploaded by" name={d.uploadedBy} note={`on ${formatDate(d.uploadedOn)}`} />
        </>
      )}
    />
  );
}
