"use client";

import Link from "next/link";
import { Building2, CalendarCheck, CalendarOff, Clock, FileText, ListTodo, Star, Wallet } from "lucide-react";
import type { Employee } from "@/types/employee";
import type { AttendanceStatus } from "@/types/attendance";
import { attendanceService } from "@/services/attendanceService";
import { departmentService, performanceService } from "@/services/employeeService";
import { documentService } from "@/services/documentService";
import { taskService } from "@/services/followupService";
import { leaveService } from "@/services/leaveService";
import { payrollService } from "@/services/payrollService";
import { useResource } from "@/hooks/useResource";
import { cn, daysBetween, formatCurrency, formatDate, sum, todayISO } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { Stars } from "@/components/hr/performance/PerformanceView";
import { ReportButton } from "@/components/reports/PersonReport";
import { EmployeeLinkCard } from "./EmployeeLinkCard";
import { employeeConfig, HR_CRUMBS } from "./EmployeesView";

const ATT_COLORS: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-500",
  Late: "bg-amber-400",
  "Half Day": "bg-ember-500",
  Absent: "bg-brand-600",
  Leave: "bg-violet-500",
};

function useEmployeeRecords(emp: Employee | undefined) {
  const attendance = useResource(attendanceService).data;
  const leaves = useResource(leaveService).data;
  const payroll = useResource(payrollService).data;
  const reviews = useResource(performanceService).data;
  const tasks = useResource(taskService).data;
  const documents = useResource(documentService).data;
  const departments = useResource(departmentService).data;
  if (!emp) return null;
  const att = attendance
    .filter((a) => a.employeeId === emp.id || a.employeeName === emp.name)
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    attendance: att,
    leaves: leaves.filter((l) => l.employeeName === emp.name).sort((a, b) => b.from.localeCompare(a.from)),
    payroll: payroll.filter((p) => p.employeeName === emp.name),
    reviews: reviews.filter((r) => r.employeeName === emp.name),
    tasks: tasks.filter((t) => t.assignee === emp.name),
    documents: documents.filter((d) => d.relatedTo === emp.name),
    department: departments.find((d) => d.name === emp.department),
  };
}

function tenure(joiningDate: string) {
  const days = daysBetween(joiningDate, todayISO());
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return years ? `${years}y ${months}m` : `${months}m`;
}

export function EmployeeDetail({ id }: { id: string }) {
  const employees = useResource(employeeConfig.service).data;
  const rec = useEmployeeRecords(employees.find((e) => e.id === id));

  return (
    <DetailPage<Employee>
      {...employeeConfig}
      basePath="/hr/employees"
      parents={HR_CRUMBS}
      id={id}
      listLabel="Employees"
      avatar="person"
      title={(e) => e.name}
      subtitle={(e) => `${e.employeeId} · ${e.designation} · ${e.department}`}
      status={(e) => e.status}
      contact={(e) => ({ email: e.email, phone: e.phone })}
      sections={[
        { title: "Personal information", items: ["name", "employeeId", "email", "phone"] },
        { title: "Employment", items: ["department", "designation", "joiningDate", "status", "salary"] },
      ]}
      stats={(e) => {
        const att = rec?.attendance ?? [];
        const present = att.filter((a) => a.status === "Present" || a.status === "Late" || a.status === "Half Day").length;
        const leaveDays = sum((rec?.leaves ?? []).filter((l) => l.status === "Approved"), (l) => l.days);
        const latest = rec?.reviews.at(-1);
        return [
          { label: "Attendance (30d)", value: att.length ? `${Math.round((present / att.length) * 100)}%` : "—", icon: CalendarCheck },
          { label: "Leave days taken", value: leaveDays, icon: CalendarOff, accent: "ember" },
          { label: "Latest rating", value: latest ? latest.rating.toFixed(1) : "—", icon: Star, accent: "cream", hint: latest?.period },
          { label: "Tenure", value: tenure(e.joiningDate), icon: Clock, accent: "dark" },
        ];
      }}
      actions={(e) => <ReportButton href={`/hr/employees/${e.id}/report`} />}
      main={() => {
        if (!rec) return null;
        const counts = rec.attendance.reduce<Record<string, number>>((m, a) => ({ ...m, [a.status]: (m[a.status] ?? 0) + 1 }), {});
        return (
          <>
            <Card>
              <CardHeader
                title="Attendance — last 30 days"
                action={
                  <Link href="/hr/attendance" className="text-xs font-semibold text-brand-700">
                    Open register
                  </Link>
                }
              />
              <div className="p-5">
                {rec.attendance.length ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {rec.attendance.map((a) => (
                        <span
                          key={a.id}
                          title={`${formatDate(a.date)} · ${a.status}${a.checkIn ? ` · ${a.checkIn}–${a.checkOut ?? ""}` : ""}`}
                          className={cn("h-6 w-6 rounded-md", ATT_COLORS[a.status])}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-600">
                      {(Object.keys(ATT_COLORS) as AttendanceStatus[]).map((s) => (
                        <span key={s} className="flex items-center gap-1.5">
                          <span className={cn("h-2.5 w-2.5 rounded-sm", ATT_COLORS[s])} />
                          {s} <b className="text-ink-900">{counts[s] ?? 0}</b>
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-stone-500">No attendance recorded yet.</p>
                )}
              </div>
            </Card>

            <RelatedCard title="Leave history" count={rec.leaves.length} empty="No leave requests.">
              {rec.leaves.map((l) => (
                <RelatedRow
                  key={l.id}
                  href={`/hr/leaves/${l.id}`}
                  leading={<Badge tone="purple">{l.type}</Badge>}
                  title={`${formatDate(l.from)}${l.to !== l.from ? ` → ${formatDate(l.to)}` : ""} · ${l.days} day${l.days > 1 ? "s" : ""}`}
                  sub={l.reason}
                  trailing={<StatusBadge status={l.status} />}
                />
              ))}
            </RelatedCard>

            <RelatedCard title="Payroll history" count={rec.payroll.length} empty="No payslips generated.">
              {rec.payroll.map((p) => (
                <RelatedRow
                  key={p.id}
                  href={`/hr/payroll/${p.id}`}
                  leading={
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Wallet className="h-4 w-4" />
                    </span>
                  }
                  title={`${p.month} · ${formatCurrency(p.netPay)}`}
                  sub={`Basic ${formatCurrency(p.basic)} + ${formatCurrency(p.allowances)} − ${formatCurrency(p.deductions)}`}
                  trailing={<StatusBadge status={p.status} />}
                />
              ))}
            </RelatedCard>

            <RelatedCard title="Performance reviews" count={rec.reviews.length} empty="No reviews yet.">
              {rec.reviews.map((r) => (
                <RelatedRow
                  key={r.id}
                  href={`/hr/performance/${r.id}`}
                  title={r.period}
                  sub={`Reviewed by ${r.reviewer} · ${r.goalsMet}% goals met`}
                  trailing={<Stars value={r.rating} />}
                />
              ))}
            </RelatedCard>
          </>
        );
      }}
      aside={(e) => {
        if (!rec) return null;
        const openTasks = rec.tasks.filter((t) => t.status !== "Done");
        return (
          <>
            <Card>
              <CardHeader title="Department" />
              {rec.department ? (
                <Link href={`/hr/departments/${rec.department.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{rec.department.name}</p>
                    <p className="text-xs text-stone-500">{rec.department.location ?? "—"}</p>
                  </div>
                </Link>
              ) : (
                <p className="p-5 text-sm text-stone-500">{e.department}</p>
              )}
            </Card>
            {rec.department && rec.department.head !== e.name && <EmployeeLinkCard title="Reports to" name={rec.department.head} />}
            <Card>
              <CardHeader title="Compensation" />
              <InfoList
                items={[
                  { label: "Monthly", value: formatCurrency(e.salary) },
                  { label: "Annual CTC", value: formatCurrency(e.salary * 12) },
                  { label: "Paid to date", value: formatCurrency(sum(rec.payroll.filter((p) => p.status === "Paid"), (p) => p.netPay)) },
                ]}
              />
            </Card>
            <RelatedCard title="Open tasks" count={openTasks.length} empty="No open tasks.">
              {openTasks.map((t) => (
                <RelatedRow key={t.id} href={`/tasks/${t.id}`} leading={<ListTodo className="h-4 w-4 text-brand-600" />} title={t.title} sub={`Due ${formatDate(t.dueDate)}`} trailing={<StatusBadge status={t.priority} />} />
              ))}
            </RelatedCard>
            <RelatedCard title="Documents" count={rec.documents.length} empty="No documents on file.">
              {rec.documents.map((d) => (
                <RelatedRow key={d.id} href={`/documents/${d.id}`} leading={<FileText className="h-4 w-4 text-brand-600" />} title={d.name} sub={d.fileType} trailing={<StatusBadge status={d.status} />} />
              ))}
            </RelatedCard>
          </>
        );
      }}
    />
  );
}
