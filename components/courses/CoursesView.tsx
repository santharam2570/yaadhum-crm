"use client";

import { BookOpen, Clock, IndianRupee, MonitorPlay } from "lucide-react";
import type { Course } from "@/types/course";
import { courseService } from "@/services/courseService";
import { formatCurrency, sum } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { Money, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig, type RowContext } from "@/components/common/ResourcePage";

const MODES = ["Offline", "Online", "Hybrid"];
const STATUSES = ["Active", "Draft", "Inactive"];
const CATEGORIES = ["Software", "Data", "Design", "Marketing", "Infrastructure", "Security"];

export const courseConfig: ResourceConfig<Course> = {
  entityName: "Course",
  module: "courses",
  service: courseService,
  basePath: "/courses",
  fields: [
    { name: "name", label: "Course name", required: true },
    { name: "code", label: "Code", required: true, placeholder: "FSD" },
    { name: "category", label: "Category", type: "select", required: true, options: CATEGORIES },
    { name: "mode", label: "Mode", type: "select", required: true, options: MODES },
    { name: "durationMonths", label: "Duration (months)", type: "number", required: true, min: 1 },
    { name: "fee", label: "Fee (₹)", type: "number", required: true, min: 0 },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "description", label: "Description", type: "textarea" },
  ],
  defaults: () => ({ status: "Draft", mode: "Hybrid", durationMonths: 3 }),
};

function CourseGrid({ rows, ctx }: { rows: Course[]; ctx: RowContext<Course> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map((c) => (
        <button
          key={c.id}
          onClick={() => ctx.open(c)}
          className="group overflow-hidden rounded-2xl border border-brand-100/70 bg-white text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5"
        >
          <div className="bg-sidebar relative h-24 overflow-hidden p-4">
            <span className="font-display text-3xl font-bold tracking-wider text-white/90">{c.code}</span>
            <span className="absolute right-4 top-4">
              <StatusBadge status={c.status} />
            </span>
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-brand-600/40 blur-xl transition group-hover:bg-brand-500/60" />
          </div>
          <div className="p-4">
            <p className="font-display text-lg font-bold leading-tight text-ink-900">{c.name}</p>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs text-stone-500">{c.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="orange">{c.category}</Badge>
              <Badge tone="blue">{c.mode}</Badge>
              <Badge tone="gray">{c.durationMonths} months</Badge>
            </div>
            <p className="mt-4 font-display text-xl font-bold text-brand-700">{formatCurrency(c.fee)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function CoursesView() {
  return (
    <ResourcePage<Course>
      {...courseConfig}
      title="Courses"
      description="Your programme catalogue with fees, duration and delivery mode."
      searchKeys={["name", "code", "category"]}
      filters={[
        { key: "mode", label: "Modes", options: MODES },
        { key: "status", label: "Statuses", options: STATUSES },
      ]}
      stats={(rows) => [
        { label: "Courses", value: rows.length, icon: BookOpen },
        { label: "Active", value: rows.filter((r) => r.status === "Active").length, icon: MonitorPlay, accent: "ember" },
        { label: "Avg. Duration", value: `${rows.length ? Math.round(sum(rows, (r) => r.durationMonths) / rows.length) : 0} mo`, icon: Clock, accent: "cream" },
        { label: "Avg. Fee", value: formatCurrency(rows.length ? sum(rows, (r) => r.fee) / rows.length : 0), icon: IndianRupee, accent: "dark" },
      ]}
      renderBoard={(rows, ctx) => <CourseGrid rows={rows} ctx={ctx} />}
      columns={[
        { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs font-bold text-brand-700">{r.code}</span> },
        { key: "name", header: "Course", render: (r) => <TitleCell title={r.name} sub={r.category} /> },
        { key: "durationMonths", header: "Duration", render: (r) => `${r.durationMonths} months`, hideBelow: "md" },
        { key: "mode", header: "Mode", hideBelow: "md" },
        { key: "fee", header: "Fee", render: (r) => <Money value={r.fee} strong /> },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
