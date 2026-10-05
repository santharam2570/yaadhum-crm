"use client";

import { CalendarOff, CheckCircle2, XCircle } from "lucide-react";
import type { Leave, LeaveType } from "@/types/leave";
import { holidayService, leaveService } from "@/services/leaveService";
import { useResource } from "@/hooks/useResource";
import { formatDate, sum } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow, StatusStepper } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { HR_CRUMBS } from "@/components/hr/employees/EmployeesView";
import { approveLeave, leaveConfig, rejectLeave } from "./LeavesView";

const ANNUAL_QUOTA: Partial<Record<LeaveType, number>> = { Casual: 12, Sick: 10, Earned: 15 };

function LeaveBalance({ row }: { row: Leave }) {
  const leaves = useResource(leaveService).data.filter((l) => l.employeeName === row.employeeName && l.status === "Approved");
  return (
    <Card>
      <CardHeader title="Leave balance" description="Approved days against the annual quota" />
      <div className="space-y-4 p-5">
        {(Object.keys(ANNUAL_QUOTA) as LeaveType[]).map((t) => {
          const used = sum(leaves.filter((l) => l.type === t), (l) => l.days);
          const quota = ANNUAL_QUOTA[t] ?? 0;
          return (
            <div key={t}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-ink-800">{t}</span>
                <span className="text-stone-500">
                  {used} used · <b className="text-ink-900">{Math.max(0, quota - used)}</b> left
                </span>
              </div>
              <Progress value={used} max={quota} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LeaveMain({ row }: { row: Leave }) {
  const others = useResource(leaveService).data.filter((l) => l.employeeName === row.employeeName && l.id !== row.id);
  const holidays = useResource(holidayService).data.filter((h) => h.date >= row.from && h.date <= row.to);
  return (
    <>
      <Card>
        <CardHeader title="Approval" />
        <div className="p-5">
          <StatusStepper steps={["Applied", "Pending", "Approved"]} current={row.status === "Rejected" ? "Pending" : row.status} failed={row.status === "Rejected"} />
          {row.status === "Rejected" && <p className="mt-3 text-xs font-semibold text-brand-700">This request was rejected.</p>}
          {holidays.length > 0 && (
            <p className="mt-4 rounded-lg bg-cream-50 px-3 py-2 text-xs text-brand-800">
              Includes holiday{holidays.length > 1 ? "s" : ""}: {holidays.map((h) => h.name).join(", ")}
            </p>
          )}
        </div>
      </Card>
      <RelatedCard title={`Other requests by ${row.employeeName.split(" ")[0]}`} count={others.length} empty="No other leave requests.">
        {others.map((l) => (
          <RelatedRow
            key={l.id}
            href={`/hr/leaves/${l.id}`}
            leading={<Badge tone="purple">{l.type}</Badge>}
            title={`${formatDate(l.from)}${l.to !== l.from ? ` → ${formatDate(l.to)}` : ""}`}
            sub={l.reason}
            trailing={<StatusBadge status={l.status} />}
          />
        ))}
      </RelatedCard>
    </>
  );
}

export function LeaveDetail({ id }: { id: string }) {
  return (
    <DetailPage<Leave>
      {...leaveConfig}
      basePath="/hr/leaves"
      parents={HR_CRUMBS}
      id={id}
      listLabel="Leaves"
      avatar={CalendarOff}
      title={(l) => `${l.employeeName} — ${l.type} leave`}
      subtitle={(l) => `${formatDate(l.from)}${l.to !== l.from ? ` → ${formatDate(l.to)}` : ""} · ${l.days} day${l.days > 1 ? "s" : ""}`}
      status={(l) => l.status}
      sections={[
        { title: "Request", items: ["employeeName", "type", "status", "appliedOn"] },
        { title: "Dates", items: ["from", "to", { key: "days", label: "Number of days" }, "reason"] },
      ]}
      actions={(l, ctx) =>
        ctx.canEdit && l.status === "Pending" ? (
          <>
            <Button
              variant="secondary"
              icon={<XCircle className="h-4 w-4" />}
              onClick={async () => {
                await rejectLeave(l);
                ctx.toast("Leave rejected", "info");
              }}
            >
              Reject
            </Button>
            <Button
              variant="dark"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={async () => {
                await approveLeave(l);
                ctx.toast("Leave approved");
              }}
            >
              Approve
            </Button>
          </>
        ) : null
      }
      main={(l) => <LeaveMain row={l} />}
      aside={(l) => (
        <>
          <EmployeeLinkCard title="Employee" name={l.employeeName} />
          <LeaveBalance row={l} />
        </>
      )}
    />
  );
}
