import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Batch } from "@/types/batch";
import { COURSE_CATALOG } from "./courseService";
import { TRAINERS } from "./employeeService";

const TIMINGS = ["09:30 AM - 11:30 AM", "11:45 AM - 01:45 PM", "02:30 PM - 04:30 PM", "06:30 PM - 08:30 PM", "Sat-Sun 10:00 AM - 01:00 PM"];

export const batchService = createCollection<Batch>("batches", () =>
  Array.from({ length: 12 }, (_, i) => {
    const course = COURSE_CATALOG[i % 7];
    const startOffset = -150 + i * 22;
    const start = daysFromToday(startOffset);
    const end = daysFromToday(startOffset + course.durationMonths * 30);
    const status = startOffset > 0 ? "Upcoming" : startOffset + course.durationMonths * 30 < 0 ? "Completed" : "Ongoing";
    const capacity = pick([25, 30, 20, 35], i);
    return {
      id: `bat_${i + 1}`,
      name: `${course.code}-${String(2026)}-${String.fromCharCode(65 + Math.floor(i / 7))}${(i % 7) + 1}`,
      course: course.name,
      trainer: pick(TRAINERS, i),
      startDate: start,
      endDate: end,
      timing: pick(TIMINGS, i),
      capacity,
      enrolled: status === "Upcoming" ? Math.floor(capacity * 0.4) : Math.min(capacity, 14 + ((i * 5) % 18)),
      status,
    } satisfies Batch;
  }),
);

export async function getBatchOptions() {
  const rows = await batchService.list();
  return rows.map((b) => b.name);
}
