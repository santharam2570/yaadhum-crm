"use client";

import { Award, GraduationCap, PauseCircle, UserCheck } from "lucide-react";
import type { Student } from "@/types/student";
import { studentService } from "@/services/studentService";
import { COURSE_NAMES, getCourseOptions } from "@/services/courseService";
import { getBatchOptions } from "@/services/batchService";
import { logActivity } from "@/services/followupService";
import { todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { DateText, PersonCell, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const STATUSES = ["Active", "Completed", "On Hold", "Dropped"];

export const studentConfig: ResourceConfig<Student> = {
  entityName: "Student",
  module: "students",
  service: studentService,
  basePath: "/students",
  fields: [
    { name: "name", label: "Full name", required: true },
    { name: "studentId", label: "Student ID", required: true, placeholder: "YS26xxx" },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "course", label: "Course", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "batch", label: "Batch", type: "select", required: true, optionsLoader: getBatchOptions },
    { name: "enrollmentDate", label: "Enrollment date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "guardianName", label: "Guardian name" },
    { name: "guardianPhone", label: "Guardian phone", type: "tel" },
    { name: "city", label: "City" },
  ],
  defaults: () => ({
    status: "Active",
    enrollmentDate: todayISO(),
    studentId: `YS26${Math.floor(200 + Math.random() * 800)}`,
  }),
};

export function StudentsView() {
  return (
    <ResourcePage<Student>
      {...studentConfig}
      title="Students"
      description="Every learner enrolled at Yaadhum — courses, batches and guardians."
      searchKeys={["name", "studentId", "email", "phone", "batch", "city"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "course", label: "Courses", options: COURSE_NAMES },
      ]}
      stats={(rows) => [
        { label: "Total Students", value: rows.length, icon: GraduationCap },
        { label: "Active", value: rows.filter((r) => r.status === "Active").length, icon: UserCheck, accent: "ember" },
        { label: "Completed", value: rows.filter((r) => r.status === "Completed").length, icon: Award, accent: "cream" },
        { label: "On Hold / Dropped", value: rows.filter((r) => r.status === "On Hold" || r.status === "Dropped").length, icon: PauseCircle, accent: "dark" },
      ]}
      columns={[
        { key: "name", header: "Student", render: (r) => <PersonCell name={r.name} sub={`${r.studentId} · ${r.email}`} /> },
        { key: "phone", header: "Phone", hideBelow: "lg" },
        { key: "course", header: "Course", render: (r) => <TitleCell title={r.course} sub={r.batch} /> },
        { key: "enrollmentDate", header: "Enrolled", render: (r) => <DateText value={r.enrollmentDate} />, hideBelow: "md" },
        { key: "guardianName", header: "Guardian", hideBelow: "lg", render: (r) => <TitleCell title={r.guardianName ?? "—"} sub={r.guardianPhone} /> },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      afterCreate={(row) => logActivity("student", "Student enrolled", `${row.name} joined ${row.batch} (${row.course}).`)}
    />
  );
}
