"use client";

import { CalendarClock, CheckCircle2, PhoneCall, XCircle } from "lucide-react";
import type { Followup } from "@/types/common";
import { followupService, logActivity } from "@/services/followupService";
import { getLeadOptions } from "@/services/leadService";
import { COUNSELLORS } from "@/services/employeeService";
import { todayISO } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { ActionChip, DateText, PersonCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

export const FOLLOWUP_TYPES = ["Call", "WhatsApp", "Email", "Meeting", "Visit"];
const STATUSES = ["Scheduled", "Completed", "Missed"];

export const followupConfig: ResourceConfig<Followup> = {
  entityName: "Follow-up",
  module: "followups",
  service: followupService,
  basePath: "/followups",
  fields: [
    { name: "leadName", label: "Lead", type: "select", required: true, optionsLoader: getLeadOptions },
    { name: "type", label: "Type", type: "select", required: true, options: FOLLOWUP_TYPES },
    { name: "dueDate", label: "Due date", type: "date", required: true },
    { name: "dueTime", label: "Time", type: "time" },
    { name: "assignedTo", label: "Assigned to", type: "select", required: true, options: COUNSELLORS },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "notes", label: "Notes / agenda", type: "textarea" },
  ],
  defaults: () => ({ type: "Call", status: "Scheduled", dueDate: todayISO(), dueTime: "11:00" }),
  onStatusChange: (row, status) =>
    status === "Completed" && row.status !== "Completed"
      ? completeFollowup(row)
      : followupService.update(row.id, { status: status as Followup["status"] }),
};

export async function completeFollowup(row: Followup) {
  await followupService.update(row.id, { status: "Completed" });
  await logActivity("followup", "Follow-up completed", `${row.type} with ${row.leadName} completed.`, row.assignedTo);
}

export function FollowupsView() {
  const today = todayISO();
  return (
    <ResourcePage<Followup>
      {...followupConfig}
      title="Follow-ups"
      description="Never miss a call back. Schedule and track every touchpoint with your leads."
      searchKeys={["leadName", "assignedTo", "notes"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "type", label: "Types", options: FOLLOWUP_TYPES },
        { key: "assignedTo", label: "Owners", options: COUNSELLORS },
      ]}
      stats={(rows) => [
        { label: "Due Today", value: rows.filter((r) => r.dueDate === today && r.status === "Scheduled").length, icon: CalendarClock },
        { label: "Upcoming", value: rows.filter((r) => r.dueDate > today && r.status === "Scheduled").length, icon: PhoneCall, accent: "ember" },
        { label: "Completed", value: rows.filter((r) => r.status === "Completed").length, icon: CheckCircle2, accent: "cream" },
        { label: "Missed / Overdue", value: rows.filter((r) => r.status === "Missed" || (r.status === "Scheduled" && r.dueDate < today)).length, icon: XCircle, accent: "dark" },
      ]}
      columns={[
        { key: "leadName", header: "Lead", render: (r) => <PersonCell name={r.leadName} sub={r.notes} /> },
        { key: "type", header: "Type", render: (r) => <Badge tone="orange">{r.type}</Badge> },
        {
          key: "dueDate",
          header: "Due",
          render: (r) => (
            <span className={r.status === "Scheduled" && r.dueDate < today ? "font-semibold text-brand-700" : ""}>
              {r.dueDate === today ? "Today" : <DateText value={r.dueDate} />} {r.dueTime && <span className="text-stone-400">· {r.dueTime}</span>}
            </span>
          ),
        },
        { key: "assignedTo", header: "Owner", hideBelow: "md" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(row, { toast, canEdit }) =>
        canEdit && row.status === "Scheduled" ? (
          <ActionChip
            label="Mark done"
            tone="green"
            onClick={async () => {
              await completeFollowup(row);
              toast("Follow-up marked as completed");
            }}
          />
        ) : null
      }
    />
  );
}
