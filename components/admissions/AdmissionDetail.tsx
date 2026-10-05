"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardList, FileText, GraduationCap, UserPlus, XCircle } from "lucide-react";
import type { Admission } from "@/types/admission";
import { courseService } from "@/services/courseService";
import { documentService } from "@/services/documentService";
import { leadService } from "@/services/leadService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { daysBetween, formatCurrency, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow, StatusStepper } from "@/components/common/Related";
import { admissionConfig, approveAdmission, enrolAdmission, rejectAdmission } from "./AdmissionsView";

function AdmissionMain({ row }: { row: Admission }) {
  const documents = useResource(documentService).data.filter((d) => d.relatedTo === row.studentName);
  return (
    <>
      <Card>
        <CardHeader title="Application progress" />
        <div className="overflow-x-auto p-5">
          <StatusStepper
            steps={["Pending", "Under Review", "Approved", "Enrolled"]}
            current={row.status === "Rejected" ? "Under Review" : row.status}
            failed={row.status === "Rejected"}
          />
          {row.status === "Rejected" && <p className="mt-3 text-xs font-semibold text-brand-700">This application was rejected.</p>}
        </div>
      </Card>
      <RelatedCard
        title="Submitted documents"
        count={documents.length}
        empty="No documents uploaded yet."
        action={
          <Link href="/documents" className="text-xs font-semibold text-brand-700">
            Upload
          </Link>
        }
      >
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
            sub={d.fileType}
            trailing={<StatusBadge status={d.status} />}
          />
        ))}
      </RelatedCard>
    </>
  );
}

function AdmissionAside({ row }: { row: Admission }) {
  const course = useResource(courseService).data.find((c) => c.name === row.course);
  const student = useResource(studentService).data.find((s) => s.name === row.studentName);
  const lead = useResource(leadService).data.find((l) => l.name === row.studentName);
  return (
    <>
      <Card>
        <CardHeader title="Counsellor" />
        <div className="flex items-center gap-3 p-5">
          <Avatar name={row.counsellor} size="lg" />
          <div>
            <p className="font-semibold text-ink-900">{row.counsellor}</p>
            <p className="text-xs text-stone-500">Handling this application</p>
          </div>
        </div>
      </Card>
      {course && (
        <Card>
          <CardHeader title="Course" />
          <InfoList
            items={[
              { label: "Course", value: <Link href={`/courses/${course.id}`} className="text-brand-700">{course.name}</Link> },
              { label: "Fee", value: formatCurrency(course.fee) },
              { label: "Duration", value: `${course.durationMonths} months` },
              { label: "Mode", value: course.mode },
            ]}
          />
        </Card>
      )}
      <RelatedCard title="Linked records" empty="No linked lead or student.">
        {[
          lead && (
            <RelatedRow key="lead" href={`/leads/${lead.id}`} leading={<UserPlus className="h-4 w-4 text-brand-600" />} title="Original lead" sub={`${lead.source} · ${lead.status}`} />
          ),
          student && (
            <RelatedRow key="student" href={`/students/${student.id}`} leading={<GraduationCap className="h-4 w-4 text-brand-600" />} title="Student profile" sub={`${student.studentId} · ${student.batch}`} />
          ),
        ].filter(Boolean)}
      </RelatedCard>
    </>
  );
}

export function AdmissionDetail({ id }: { id: string }) {
  return (
    <DetailPage<Admission>
      {...admissionConfig}
      basePath="/admissions"
      id={id}
      listLabel="Admissions"
      avatar={ClipboardList}
      title={(r) => r.studentName}
      subtitle={(r) => `${r.applicationNo} · ${r.course} · applied ${daysBetween(r.appliedOn, todayISO()) - 1} days ago`}
      status={(r) => r.status}
      contact={(r) => ({ email: r.email, phone: r.phone })}
      sections={[
        { title: "Applicant", items: ["studentName", "email", "phone", "qualification"] },
        { title: "Application", items: ["applicationNo", "course", "appliedOn", "counsellor", "status", "remarks"] },
      ]}
      actions={(r, ctx) => {
        if (!ctx.canEdit) return null;
        if (r.status === "Pending" || r.status === "Under Review")
          return (
            <>
              <Button variant="secondary" icon={<XCircle className="h-4 w-4" />} onClick={() => rejectAdmission(r)}>
                Reject
              </Button>
              <Button
                variant="dark"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={async () => {
                  await approveAdmission(r);
                  ctx.toast("Application approved");
                }}
              >
                Approve
              </Button>
            </>
          );
        if (r.status === "Approved")
          return (
            <Button
              variant="dark"
              icon={<GraduationCap className="h-4 w-4" />}
              onClick={async () => {
                await enrolAdmission(r);
                ctx.toast(`${r.studentName} enrolled as a student`);
              }}
            >
              Enrol
            </Button>
          );
        return null;
      }}
      main={(r) => <AdmissionMain row={r} />}
      aside={(r) => <AdmissionAside row={r} />}
    />
  );
}
