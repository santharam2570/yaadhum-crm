"use client";

import { CheckCircle2, ClipboardList, Hourglass, UserCheck } from "lucide-react";
import type { Admission } from "@/types/admission";
import { admissionService } from "@/services/admissionService";
import { COURSE_NAMES, getCourseOptions } from "@/services/courseService";
import { COUNSELLORS } from "@/services/employeeService";
import { studentService } from "@/services/studentService";
import { logActivity } from "@/services/followupService";
import { todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { ActionChip, DateText, PersonCell, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

export const ADMISSION_STATUSES = ["Pending", "Under Review", "Approved", "Enrolled", "Rejected"];

export const admissionConfig: ResourceConfig<Admission> = {
  entityName: "Application",
  module: "admissions",
  service: admissionService,
  basePath: "/admissions",
  fields: [
    { name: "applicationNo", label: "Application no.", required: true },
    { name: "studentName", label: "Applicant name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "course", label: "Course", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "qualification", label: "Qualification" },
    { name: "appliedOn", label: "Applied on", type: "date", required: true },
    { name: "counsellor", label: "Counsellor", type: "select", required: true, options: COUNSELLORS },
    { name: "status", label: "Status", type: "select", required: true, options: ADMISSION_STATUSES },
    { name: "remarks", label: "Remarks", type: "textarea" },
  ],
  defaults: () => ({
    status: "Pending",
    appliedOn: todayISO(),
    applicationNo: `APP-26-${Math.floor(400 + Math.random() * 600)}`,
  }),
  onStatusChange: (row, status) => {
    if (status === "Approved") return approveAdmission(row);
    if (status === "Enrolled" && row.status !== "Enrolled") return enrolAdmission(row);
    return admissionService.update(row.id, { status: status as Admission["status"] });
  },
};

export async function approveAdmission(row: Admission) {
  await admissionService.update(row.id, { status: "Approved" });
  await logActivity("admission", "Admission approved", `${row.applicationNo} for ${row.course} was approved.`);
}

export async function rejectAdmission(row: Admission) {
  await admissionService.update(row.id, { status: "Rejected" });
}

/** Marks the application enrolled and creates the student record. */
export async function enrolAdmission(row: Admission) {
  await admissionService.update(row.id, { status: "Enrolled" });
  await studentService.create({
    studentId: `YS26${Math.floor(200 + Math.random() * 800)}`,
    name: row.studentName,
    email: row.email,
    phone: row.phone,
    course: row.course,
    batch: "To be assigned",
    enrollmentDate: todayISO(),
    status: "Active",
  });
  await logActivity("student", "Student enrolled", `${row.studentName} enrolled in ${row.course}.`);
}

export function AdmissionsView() {
  return (
    <ResourcePage<Admission>
      {...admissionConfig}
      title="Admissions"
      description="Review applications, approve and enrol new students."
      searchKeys={["applicationNo", "studentName", "email", "phone", "course"]}
      filters={[
        { key: "status", label: "Statuses", options: ADMISSION_STATUSES },
        { key: "course", label: "Courses", options: COURSE_NAMES },
        { key: "counsellor", label: "Counsellors", options: COUNSELLORS },
      ]}
      stats={(rows) => [
        { label: "Applications", value: rows.length, icon: ClipboardList },
        { label: "Awaiting Review", value: rows.filter((r) => r.status === "Pending" || r.status === "Under Review").length, icon: Hourglass, accent: "ember" },
        { label: "Approved", value: rows.filter((r) => r.status === "Approved").length, icon: CheckCircle2, accent: "cream" },
        { label: "Enrolled", value: rows.filter((r) => r.status === "Enrolled").length, icon: UserCheck, accent: "dark" },
      ]}
      columns={[
        { key: "applicationNo", header: "Application", render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.applicationNo}</span> },
        { key: "studentName", header: "Applicant", render: (r) => <PersonCell name={r.studentName} sub={r.phone} /> },
        { key: "course", header: "Course", render: (r) => <TitleCell title={r.course} sub={r.qualification} />, hideBelow: "md" },
        { key: "appliedOn", header: "Applied", render: (r) => <DateText value={r.appliedOn} />, hideBelow: "sm" },
        { key: "counsellor", header: "Counsellor", hideBelow: "lg" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      afterCreate={(row) => logActivity("admission", "New application", `${row.studentName} applied for ${row.course}.`, row.counsellor)}
      rowActions={(row, { toast, canEdit }) => {
        if (!canEdit) return null;
        if (row.status === "Pending" || row.status === "Under Review")
          return (
            <>
              <ActionChip
                label="Approve"
                tone="green"
                onClick={async () => {
                  await approveAdmission(row);
                  toast(`${row.studentName}'s application approved`);
                }}
              />
              <ActionChip label="Reject" tone="gray" onClick={() => rejectAdmission(row)} />
            </>
          );
        if (row.status === "Approved")
          return (
            <ActionChip
              label="Enrol"
              onClick={async () => {
                await enrolAdmission(row);
                toast(`${row.studentName} enrolled as a student`);
              }}
            />
          );
        return null;
      }}
    />
  );
}
