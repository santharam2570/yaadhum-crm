"use client";

import { CalendarOff, CheckCircle2, Hourglass, XCircle } from "lucide-react";
import type { Leave } from "@/types/leave";
import { leaveService } from "@/services/leaveService";
import { getEmployeeOptions } from "@/services/employeeService";
import { logActivity } from "@/services/followupService";
import { daysBetween, daysFromToday, formatDate, todayISO } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { ActionChip, PersonCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const TYPES = ["Casual", "Sick", "Earned", "Maternity", "Unpaid"];
const STATUSES = ["Pending", "Approved", "Rejected"];

export const leaveConfig: ResourceConfig<Leave> = {
  entityName: "Leave request",
  module: "hr",
  service: leaveService,
  basePath: "/hr/leaves",
  fields: [
    { name: "employeeName", label: "Employee", type: "select", required: true, optionsLoader: getEmployeeOptions },
    { name: "type", label: "Leave type", type: "select", required: true, options: TYPES },
    { name: "from", label: "From", type: "date", required: true },
    { name: "to", label: "To", type: "date", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "reason", label: "Reason", type: "textarea", required: true },
  ],
  defaults: () => ({ type: "Casual", status: "Pending", from: daysFromToday(1), to: daysFromToday(1) }),
  beforeSave: (v, existing) => ({
    days: daysBetween(String(v.from), String(v.to)),
    appliedOn: existing?.appliedOn ?? todayISO(),
  }),
  onStatusChange: (row, status) =>
    status === "Approved" ? approveLeave(row) : leaveService.update(row.id, { status: status as Leave["status"] }),
};

export async function approveLeave(row: Leave) {
  await leaveService.update(row.id, { status: "Approved" });
  await logActivity("hr", "Leave approved", `${row.employeeName}'s ${row.type.toLowerCase()} leave was approved.`);
}

export function rejectLeave(row: Leave) {
  return leaveService.update(row.id, { status: "Rejected" });
}

export function LeavesView() {
  return (
    <ResourcePage<Leave>
      {...leaveConfig}
      title="Leaves"
      description="Leave requests and approvals across the organisation."
      breadcrumbs={[{ label: "HR", href: "/hr" }, { label: "Leaves" }]}
      searchKeys={["employeeName", "reason", "type"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "type", label: "Types", options: TYPES },
      ]}
      stats={(rows) => [
        { label: "Requests", value: rows.length, icon: CalendarOff },
        { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, icon: Hourglass, accent: "ember" },
        { label: "Approved", value: rows.filter((r) => r.status === "Approved").length, icon: CheckCircle2, accent: "cream" },
        { label: "Rejected", value: rows.filter((r) => r.status === "Rejected").length, icon: XCircle, accent: "dark" },
      ]}
      columns={[
        { key: "employeeName", header: "Employee", render: (r) => <PersonCell name={r.employeeName} sub={r.reason} /> },
        { key: "type", header: "Type", render: (r) => <Badge tone="purple">{r.type}</Badge> },
        {
          key: "from",
          header: "Dates",
          render: (r) => (
            <span className="text-xs">
              {formatDate(r.from, { day: "2-digit", month: "short" })}
              {r.to !== r.from && <> → {formatDate(r.to, { day: "2-digit", month: "short" })}</>}
            </span>
          ),
        },
        { key: "days", header: "Days", render: (r) => <b>{r.days}</b>, hideBelow: "sm" },
        { key: "appliedOn", header: "Applied", render: (r) => formatDate(r.appliedOn), hideBelow: "lg" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(row, { toast, canEdit }) =>
        canEdit && row.status === "Pending" ? (
          <>
            <ActionChip
              label="Approve"
              tone="green"
              onClick={async () => {
                await approveLeave(row);
                toast("Leave approved");
              }}
            />
            <ActionChip
              label="Reject"
              tone="gray"
              onClick={async () => {
                await rejectLeave(row);
                toast("Leave rejected", "info");
              }}
            />
          </>
        ) : null
      }
    />
  );
}
