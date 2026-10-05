"use client";

import Link from "next/link";
import { Armchair, BookOpen, CalendarRange, Layers, Users } from "lucide-react";
import type { Batch } from "@/types/batch";
import { courseService } from "@/services/courseService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { daysBetween, formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { batchConfig } from "./BatchesView";

function timeline(b: Batch) {
  const today = todayISO();
  const total = Math.max(1, daysBetween(b.startDate, b.endDate));
  const elapsed = Math.min(total, Math.max(0, daysBetween(b.startDate, today) - 1));
  const label =
    today < b.startDate
      ? `Starts in ${daysBetween(today, b.startDate) - 1} days`
      : today > b.endDate
        ? "Completed"
        : `${daysBetween(today, b.endDate) - 1} days left`;
  return { total, elapsed, pct: Math.round((elapsed / total) * 100), label };
}

export function BatchDetail({ id }: { id: string }) {
  const students = useResource(studentService).data;
  const courses = useResource(courseService).data;

  return (
    <DetailPage<Batch>
      {...batchConfig}
      basePath="/batches"
      id={id}
      listLabel="Batches"
      avatar={Layers}
      title={(b) => b.name}
      subtitle={(b) => `${b.course} · ${b.timing}`}
      status={(b) => b.status}
      sections={[
        { title: "Batch information", items: ["name", "course", "trainer", "timing", "status"] },
        { title: "Schedule & capacity", items: ["startDate", "endDate", "capacity", "enrolled"] },
      ]}
      stats={(b) => {
        const t = timeline(b);
        return [
          { label: "Enrolled", value: `${b.enrolled}/${b.capacity}`, icon: Users },
          { label: "Seats left", value: Math.max(0, b.capacity - b.enrolled), icon: Armchair, accent: "ember" },
          { label: "Utilisation", value: `${Math.round((b.enrolled / Math.max(1, b.capacity)) * 100)}%`, icon: Layers, accent: "cream" },
          { label: "Timeline", value: t.label, icon: CalendarRange, accent: "dark" },
        ];
      }}
      main={(b) => {
        const roster = students.filter((s) => s.batch === b.name);
        const t = timeline(b);
        return (
          <>
            <Card>
              <CardHeader title="Progress" description={`${formatDate(b.startDate)} → ${formatDate(b.endDate)} · ${t.total} days`} />
              <div className="space-y-4 p-5">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-stone-500">
                    <span>Course timeline</span>
                    <span className="font-semibold text-ink-800">{t.pct}%</span>
                  </div>
                  <Progress value={t.elapsed} max={t.total} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-stone-500">
                    <span>Seats filled</span>
                    <span className="font-semibold text-ink-800">
                      {b.enrolled} of {b.capacity}
                    </span>
                  </div>
                  <Progress value={b.enrolled} max={b.capacity} />
                </div>
              </div>
            </Card>
            <RelatedCard title="Student roster" count={roster.length} empty="No student records are assigned to this batch yet.">
              {roster.map((s) => (
                <RelatedRow
                  key={s.id}
                  href={`/students/${s.id}`}
                  leading={<Avatar name={s.name} />}
                  title={s.name}
                  sub={`${s.studentId} · ${s.phone}`}
                  trailing={<StatusBadge status={s.status} />}
                />
              ))}
            </RelatedCard>
          </>
        );
      }}
      aside={(b) => {
        const course = courses.find((c) => c.name === b.course);
        return (
          <>
            <EmployeeLinkCard title="Trainer" name={b.trainer} />
            {course && (
              <Card>
                <CardHeader title="Course" />
                <Link href={`/courses/${course.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink-900">{course.name}</p>
                    <p className="text-xs text-stone-500">
                      {course.code} · {course.durationMonths} months · {course.mode}
                    </p>
                  </div>
                </Link>
                <InfoList
                  items={[
                    { label: "Fee per student", value: formatCurrency(course.fee) },
                    { label: "Batch revenue potential", value: formatCurrency(course.fee * b.enrolled) },
                  ]}
                />
              </Card>
            )}
          </>
        );
      }}
    />
  );
}
