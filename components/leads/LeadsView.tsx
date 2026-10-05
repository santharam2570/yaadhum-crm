"use client";

import { Sparkles, UserCheck, UserPlus, Users } from "lucide-react";
import type { Lead, LeadStatus } from "@/types/lead";
import { leadService, LEAD_SOURCES, LEAD_STATUSES } from "@/services/leadService";
import { startOnboarding } from "@/services/onboardingService";
import { getCourseOptions, COURSE_NAMES } from "@/services/courseService";
import { COUNSELLORS } from "@/services/employeeService";
import { logActivity } from "@/services/followupService";
import { todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { ActionChip, DateText, PersonCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

export const leadConfig: ResourceConfig<Lead> = {
  entityName: "Lead",
  module: "leads",
  service: leadService,
  basePath: "/leads",
  fields: [
    { name: "name", label: "Full name", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+91 98765 43210" },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "city", label: "City" },
    { name: "courseInterest", label: "Course interested", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "source", label: "Source", type: "select", required: true, options: LEAD_SOURCES },
    { name: "status", label: "Status", type: "select", required: true, options: LEAD_STATUSES },
    { name: "assignedTo", label: "Assigned to", type: "select", required: true, options: COUNSELLORS },
    { name: "createdAt", label: "Created on", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
  defaults: () => ({ status: "New", source: "Website", createdAt: todayISO() }),
  beforeSave: (v, existing) => ({ createdAt: (v.createdAt as string) || existing?.createdAt || todayISO() }),
  onStatusChange: (row, status) =>
    status === "Converted" && row.status !== "Converted" ? convertLead(row) : leadService.update(row.id, { status: status as LeadStatus }),
};

/** Marks the lead converted and starts onboarding for it. */
export function convertLead(row: Lead) {
  return startOnboarding(row);
}

export function LeadsView() {
  return (
    <ResourcePage<Lead>
      {...leadConfig}
      title="Leads"
      description="Capture, qualify and convert every enquiry."
      searchKeys={["name", "email", "phone", "courseInterest", "city"]}
      filters={[
        { key: "status", label: "Statuses", options: LEAD_STATUSES },
        { key: "source", label: "Sources", options: LEAD_SOURCES },
        { key: "courseInterest", label: "Courses", options: COURSE_NAMES },
      ]}
      stats={(rows) => [
        { label: "Total Leads", value: rows.length, icon: Users },
        { label: "New", value: rows.filter((r) => r.status === "New").length, icon: UserPlus, accent: "ember" },
        { label: "Qualified", value: rows.filter((r) => r.status === "Qualified").length, icon: Sparkles, accent: "cream" },
        { label: "Converted", value: rows.filter((r) => r.status === "Converted").length, icon: UserCheck, accent: "dark" },
      ]}
      columns={[
        { key: "name", header: "Lead", render: (r) => <PersonCell name={r.name} sub={r.phone} /> },
        { key: "courseInterest", header: "Interested in", hideBelow: "lg" },
        { key: "source", header: "Source", hideBelow: "md" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "assignedTo", header: "Owner", hideBelow: "lg" },
        { key: "createdAt", header: "Created", render: (r) => <DateText value={r.createdAt} />, hideBelow: "sm" },
      ]}
      afterCreate={(row) => logActivity("lead", "New lead captured", `${row.name} enquired about ${row.courseInterest} via ${row.source}.`, row.assignedTo)}
      rowActions={(row, { toast, canEdit }) =>
        canEdit && row.status !== "Converted" && row.status !== "Lost" ? (
          <ActionChip
            label="Convert"
            tone="green"
            onClick={async () => {
              await convertLead(row);
              toast(`${row.name} converted. Onboarding started.`);
            }}
          />
        ) : null
      }
    />
  );
}
