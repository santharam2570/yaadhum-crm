"use client";

import { Award, ClipboardCheck, Star, Target } from "lucide-react";
import type { PerformanceReview } from "@/types/employee";
import { getEmployeeOptions, performanceService } from "@/services/employeeService";
import { sum } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { PersonCell, Progress } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const STATUSES = ["Draft", "Pending", "Completed"];
const PERIODS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Annual 2026"];

export const performanceConfig: ResourceConfig<PerformanceReview> = {
  entityName: "Review",
  module: "hr",
  service: performanceService,
  basePath: "/hr/performance",
  fields: [
    { name: "employeeName", label: "Employee", type: "select", required: true, optionsLoader: getEmployeeOptions },
    { name: "reviewer", label: "Reviewer", type: "select", required: true, optionsLoader: getEmployeeOptions },
    { name: "period", label: "Period", type: "select", required: true, options: PERIODS },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "rating", label: "Rating (1–5)", type: "number", required: true, min: 1, max: 5, step: 0.5 },
    { name: "goalsMet", label: "Goals met (%)", type: "number", required: true, min: 0, max: 100 },
    { name: "comments", label: "Comments", type: "textarea" },
  ],
  defaults: () => ({ period: "Q3 2026", status: "Draft", rating: 3, goalsMet: 70 }),
};

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative h-4 w-4">
            <Star className="absolute h-4 w-4 text-cream-300" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-4 w-4 fill-ember-500 text-ember-500" />
            </span>
          </span>
        );
      })}
      <span className="ml-1.5 text-xs font-semibold text-ink-800">{value.toFixed(1)}</span>
    </span>
  );
}

export function PerformanceView() {
  return (
    <ResourcePage<PerformanceReview>
      {...performanceConfig}
      title="Performance"
      description="Quarterly reviews, ratings and goal achievement."
      breadcrumbs={[{ label: "HR", href: "/hr" }, { label: "Performance" }]}
      searchKeys={["employeeName", "reviewer", "period"]}
      filters={[
        { key: "period", label: "Periods", options: PERIODS },
        { key: "status", label: "Statuses", options: STATUSES },
      ]}
      stats={(rows) => {
        const top = [...rows].sort((a, b) => b.rating - a.rating)[0];
        return [
          { label: "Reviews", value: rows.length, icon: ClipboardCheck },
          { label: "Avg. Rating", value: rows.length ? (sum(rows, (r) => r.rating) / rows.length).toFixed(1) : "—", icon: Star, accent: "ember" },
          { label: "Avg. Goals Met", value: `${rows.length ? Math.round(sum(rows, (r) => r.goalsMet) / rows.length) : 0}%`, icon: Target, accent: "cream" },
          { label: "Top Performer", value: top?.employeeName ?? "—", icon: Award, accent: "dark" },
        ];
      }}
      columns={[
        { key: "employeeName", header: "Employee", render: (r) => <PersonCell name={r.employeeName} sub={`Reviewed by ${r.reviewer}`} /> },
        { key: "period", header: "Period" },
        { key: "rating", header: "Rating", render: (r) => <Stars value={r.rating} /> },
        { key: "goalsMet", header: "Goals met", render: (r) => <Progress value={r.goalsMet} />, hideBelow: "md" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
