"use client";

import type { AttendanceStatus } from "@/types/attendance";
import { attendanceService } from "@/services/attendanceService";
import { employeeService, performanceService } from "@/services/employeeService";
import { taskService } from "@/services/followupService";
import { leaveService } from "@/services/leaveService";
import { payrollService } from "@/services/payrollService";
import { useResource } from "@/hooks/useResource";
import { formatCurrency, formatDate, sum } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { ReportFields, ReportSection, ReportShell, ReportTable, ReportTiles } from "@/components/reports/PersonReport";

const ATT_STATUSES: AttendanceStatus[] = ["Present", "Late", "Half Day", "Absent", "Leave"];

export function EmployeeReport({ id }: { id: string }) {
  const employees = useResource(employeeService);
  const attendance = useResource(attendanceService).data;
  const leaves = useResource(leaveService).data;
  const payroll = useResource(payrollService).data;
  const reviews = useResource(performanceService).data;
  const tasks = useResource(taskService).data;

  const e = employees.data.find((r) => r.id === id);
  const att = e ? attendance.filter((a) => a.employeeId === e.id || a.employeeName === e.name) : [];
  const present = att.filter((a) => a.status === "Present" || a.status === "Late" || a.status === "Half Day").length;
  const myLeaves = e ? leaves.filter((l) => l.employeeName === e.name).sort((a, b) => b.from.localeCompare(a.from)) : [];
  const myPay = e ? payroll.filter((p) => p.employeeName === e.name) : [];
  const myReviews = e ? reviews.filter((r) => r.employeeName === e.name) : [];
  const myTasks = e ? tasks.filter((t) => t.assignee === e.name) : [];
  const avgRating = myReviews.length ? sum(myReviews, (r) => r.rating) / myReviews.length : 0;

  return (
    <ReportShell
      kind="Employee"
      name={e?.name}
      subtitle={e && `${e.employeeId} · ${e.designation} · ${e.department}`}
      status={e?.status}
      backHref={`/hr/employees/${id}`}
      loading={employees.loading}
      found={!!e}
    >
      {e && (
        <>
          <ReportTiles
            items={[
              { label: "Attendance (30d)", value: att.length ? `${Math.round((present / att.length) * 100)}%` : "—", tone: "good" },
              { label: "Leave days taken", value: sum(myLeaves.filter((l) => l.status === "Approved"), (l) => l.days) },
              { label: "Avg. rating", value: avgRating ? avgRating.toFixed(1) : "—" },
              { label: "Open tasks", value: myTasks.filter((t) => t.status !== "Done").length },
            ]}
          />
          <ReportSection title="Personal information">
            <ReportFields
              items={[
                { label: "Full name", value: e.name },
                { label: "Employee ID", value: e.employeeId },
                { label: "Work email", value: e.email },
                { label: "Phone", value: e.phone },
              ]}
            />
          </ReportSection>
          <ReportSection title="Employment">
            <ReportFields
              items={[
                { label: "Department", value: e.department },
                { label: "Designation", value: e.designation },
                { label: "Joining date", value: formatDate(e.joiningDate) },
                { label: "Status", value: e.status },
                { label: "Monthly salary", value: formatCurrency(e.salary) },
                { label: "Annual CTC", value: formatCurrency(e.salary * 12) },
              ]}
            />
          </ReportSection>
          <ReportSection title="Attendance — last 30 days">
            <ReportFields
              items={[
                { label: "Days recorded", value: att.length },
                ...ATT_STATUSES.map((s) => ({ label: s, value: att.filter((a) => a.status === s).length })),
              ]}
            />
          </ReportSection>
          <ReportSection title={`Leave history (${myLeaves.length})`}>
            <ReportTable
              rows={myLeaves}
              empty="No leave requests."
              columns={[
                { header: "Type", cell: (l) => l.type },
                { header: "From", cell: (l) => formatDate(l.from) },
                { header: "To", cell: (l) => formatDate(l.to) },
                { header: "Days", cell: (l) => l.days, align: "right" },
                { header: "Reason", cell: (l) => l.reason },
                { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Payroll (${myPay.length})`}>
            <ReportTable
              rows={myPay}
              empty="No payslips."
              columns={[
                { header: "Month", cell: (p) => p.month },
                { header: "Basic", cell: (p) => formatCurrency(p.basic), align: "right" },
                { header: "Allowances", cell: (p) => formatCurrency(p.allowances), align: "right" },
                { header: "Deductions", cell: (p) => formatCurrency(p.deductions), align: "right" },
                { header: "Net pay", cell: (p) => <b>{formatCurrency(p.netPay)}</b>, align: "right" },
                { header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Performance reviews (${myReviews.length})`}>
            <ReportTable
              rows={myReviews}
              empty="No reviews."
              columns={[
                { header: "Period", cell: (r) => r.period },
                { header: "Reviewer", cell: (r) => r.reviewer },
                { header: "Rating", cell: (r) => `${r.rating.toFixed(1)} / 5` },
                { header: "Goals met", cell: (r) => `${r.goalsMet}%` },
                { header: "Comments", cell: (r) => r.comments || "—" },
                { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Tasks (${myTasks.length})`}>
            <ReportTable
              rows={myTasks}
              empty="No tasks assigned."
              columns={[
                { header: "Task", cell: (t) => t.title },
                { header: "Due", cell: (t) => formatDate(t.dueDate) },
                { header: "Priority", cell: (t) => <StatusBadge status={t.priority} /> },
                { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
              ]}
            />
          </ReportSection>
        </>
      )}
    </ReportShell>
  );
}
