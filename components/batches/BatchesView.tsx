"use client";

import { CalendarClock, Layers, PlayCircle, Users } from "lucide-react";
import type { Batch } from "@/types/batch";
import { batchService } from "@/services/batchService";
import { COURSE_NAMES, getCourseOptions } from "@/services/courseService";
import { TRAINERS } from "@/services/employeeService";
import { daysFromToday, formatDate, sum } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Progress, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const STATUSES = ["Upcoming", "Ongoing", "Completed"];

export const batchConfig: ResourceConfig<Batch> = {
  entityName: "Batch",
  module: "batches",
  service: batchService,
  basePath: "/batches",
  fields: [
    { name: "name", label: "Batch name", required: true, placeholder: "FSD-2026-C1" },
    { name: "course", label: "Course", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "trainer", label: "Trainer", type: "select", required: true, options: TRAINERS },
    { name: "timing", label: "Timing", required: true, placeholder: "09:30 AM - 11:30 AM" },
    { name: "startDate", label: "Start date", type: "date", required: true },
    { name: "endDate", label: "End date", type: "date", required: true },
    { name: "capacity", label: "Capacity", type: "number", required: true, min: 1 },
    { name: "enrolled", label: "Enrolled", type: "number", min: 0 },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
  ],
  defaults: () => ({ status: "Upcoming", capacity: 30, enrolled: 0, startDate: daysFromToday(14), endDate: daysFromToday(134) }),
};

export function BatchesView() {
  return (
    <ResourcePage<Batch>
      {...batchConfig}
      title="Batches"
      description="Schedule batches, assign trainers and track seat utilisation."
      searchKeys={["name", "course", "trainer"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "course", label: "Courses", options: COURSE_NAMES },
        { key: "trainer", label: "Trainers", options: TRAINERS },
      ]}
      stats={(rows) => [
        { label: "Batches", value: rows.length, icon: Layers },
        { label: "Ongoing", value: rows.filter((r) => r.status === "Ongoing").length, icon: PlayCircle, accent: "ember" },
        { label: "Upcoming", value: rows.filter((r) => r.status === "Upcoming").length, icon: CalendarClock, accent: "cream" },
        {
          label: "Seat Utilisation",
          value: `${Math.round((sum(rows, (r) => r.enrolled) / Math.max(1, sum(rows, (r) => r.capacity))) * 100)}%`,
          icon: Users,
          accent: "dark",
        },
      ]}
      columns={[
        { key: "name", header: "Batch", render: (r) => <TitleCell title={r.name} sub={r.course} /> },
        { key: "trainer", header: "Trainer", hideBelow: "md" },
        { key: "timing", header: "Timing", hideBelow: "lg" },
        {
          key: "startDate",
          header: "Duration",
          render: (r) => (
            <span className="text-xs text-stone-600">
              {formatDate(r.startDate, { day: "2-digit", month: "short" })} → {formatDate(r.endDate, { day: "2-digit", month: "short", year: "2-digit" })}
            </span>
          ),
          hideBelow: "sm",
        },
        {
          key: "enrolled",
          header: "Seats",
          render: (r) => (
            <div>
              <p className="text-xs font-semibold">
                {r.enrolled}/{r.capacity}
              </p>
              <Progress value={r.enrolled} max={r.capacity} />
            </div>
          ),
        },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
