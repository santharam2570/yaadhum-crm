"use client";

import { Building2, CalendarOff, IndianRupee, Star, Users } from "lucide-react";
import type { Department } from "@/types/employee";
import { employeeService, performanceService } from "@/services/employeeService";
import { leaveService } from "@/services/leaveService";
import { useResource } from "@/hooks/useResource";
import { formatCompact, formatCurrency, formatDate, sum, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { departmentConfig } from "./DepartmentsView";
import { EmployeeLinkCard } from "./EmployeeLinkCard";
import { HR_CRUMBS } from "./EmployeesView";

export function DepartmentDetail({ id }: { id: string }) {
  const employees = useResource(employeeService).data;
  const reviews = useResource(performanceService).data;
  const leaves = useResource(leaveService).data;

  const related = (d: Department) => {
    const team = employees.filter((e) => e.department === d.name);
    const names = new Set(team.map((e) => e.name));
    const deptReviews = reviews.filter((r) => names.has(r.employeeName));
    const today = todayISO();
    return {
      team,
      avgRating: deptReviews.length ? sum(deptReviews, (r) => r.rating) / deptReviews.length : 0,
      onLeave: leaves.filter((l) => names.has(l.employeeName) && l.status === "Approved" && l.from <= today && l.to >= today),
      upcomingLeaves: leaves.filter((l) => names.has(l.employeeName) && l.status !== "Rejected" && l.to >= today),
    };
  };

  return (
    <DetailPage<Department>
      {...departmentConfig}
      basePath="/hr/departments"
      parents={HR_CRUMBS}
      id={id}
      listLabel="Departments"
      avatar={Building2}
      title={(d) => d.name}
      subtitle={(d) => `Headed by ${d.head}${d.location ? ` · ${d.location}` : ""}`}
      sections={[{ title: "Department information", items: ["name", "head", "location", "description"] }]}
      stats={(d) => {
        const r = related(d);
        return [
          { label: "Members", value: r.team.length, icon: Users },
          { label: "Monthly payroll", value: formatCompact(sum(r.team, (e) => e.salary)), icon: IndianRupee, accent: "ember" },
          { label: "Avg. rating", value: r.avgRating ? r.avgRating.toFixed(1) : "—", icon: Star, accent: "cream" },
          { label: "On leave today", value: r.onLeave.length, icon: CalendarOff, accent: "dark" },
        ];
      }}
      main={(d) => {
        const r = related(d);
        return (
          <RelatedCard title="Team members" count={r.team.length} empty="No employees in this department yet.">
            {r.team.map((e) => (
              <RelatedRow
                key={e.id}
                href={`/hr/employees/${e.id}`}
                leading={<Avatar name={e.name} />}
                title={
                  <span className="flex items-center gap-2">
                    {e.name}
                    {e.name === d.head && <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800">HEAD</span>}
                  </span>
                }
                sub={`${e.designation} · ${e.employeeId}`}
                trailing={<StatusBadge status={e.status} />}
              />
            ))}
          </RelatedCard>
        );
      }}
      aside={(d) => {
        const r = related(d);
        const salaries = r.team.map((e) => e.salary);
        return (
          <>
            <EmployeeLinkCard title="Department head" name={d.head} />
            <Card>
              <CardHeader title="Compensation" />
              <InfoList
                items={[
                  { label: "Monthly total", value: formatCurrency(sum(salaries, (s) => s)) },
                  { label: "Average salary", value: formatCurrency(salaries.length ? Math.round(sum(salaries, (s) => s) / salaries.length) : 0) },
                  { label: "Highest", value: formatCurrency(salaries.length ? Math.max(...salaries) : 0) },
                ]}
              />
            </Card>
            <RelatedCard title="Current & upcoming leave" count={r.upcomingLeaves.length} empty="No upcoming leave.">
              {r.upcomingLeaves.map((l) => (
                <RelatedRow key={l.id} href={`/hr/leaves/${l.id}`} title={l.employeeName} sub={`${l.type} · ${formatDate(l.from)} → ${formatDate(l.to)}`} trailing={<StatusBadge status={l.status} />} />
              ))}
            </RelatedCard>
          </>
        );
      }}
    />
  );
}
