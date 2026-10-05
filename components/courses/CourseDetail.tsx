"use client";

import { BookOpen, GraduationCap, IndianRupee, Layers, UserPlus } from "lucide-react";
import type { Course } from "@/types/course";
import { batchService } from "@/services/batchService";
import { leadService } from "@/services/leadService";
import { paymentService } from "@/services/paymentService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { formatCompact, formatCurrency, formatDate, sum } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { Avatar } from "@/components/common/Avatar";
import { courseConfig } from "./CoursesView";

export function CourseDetail({ id }: { id: string }) {
  const batches = useResource(batchService).data;
  const students = useResource(studentService).data;
  const leads = useResource(leadService).data;
  const payments = useResource(paymentService).data;

  const related = (c: Course) => {
    const courseStudents = students.filter((s) => s.course === c.name);
    const names = new Set(courseStudents.map((s) => s.name));
    return {
      batches: batches.filter((b) => b.course === c.name),
      students: courseStudents,
      leads: leads.filter((l) => l.courseInterest === c.name && l.status !== "Converted" && l.status !== "Lost"),
      revenue: sum(payments.filter((p) => p.status === "Success" && names.has(p.studentName)), (p) => p.amount),
    };
  };

  return (
    <DetailPage<Course>
      {...courseConfig}
      basePath="/courses"
      id={id}
      listLabel="Courses"
      avatar={BookOpen}
      title={(c) => c.name}
      subtitle={(c) => `${c.code} · ${c.category} · ${c.durationMonths} months · ${c.mode}`}
      status={(c) => c.status}
      sections={[
        { title: "Course information", items: ["name", "code", "category", "mode", "durationMonths", "fee", "status", "description"] },
      ]}
      stats={(c) => {
        const r = related(c);
        return [
          { label: "Students", value: r.students.length, icon: GraduationCap },
          { label: "Batches", value: r.batches.length, icon: Layers, accent: "ember" },
          { label: "Open leads", value: r.leads.length, icon: UserPlus, accent: "cream" },
          { label: "Revenue", value: formatCompact(r.revenue), icon: IndianRupee, accent: "dark" },
        ];
      }}
      main={(c) => {
        const r = related(c);
        return (
          <>
            <RelatedCard title="Batches" count={r.batches.length} empty="No batches scheduled for this course.">
              {r.batches.map((b) => (
                <RelatedRow
                  key={b.id}
                  href={`/batches/${b.id}`}
                  leading={
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
                      <Layers className="h-4 w-4" />
                    </span>
                  }
                  title={b.name}
                  sub={`${b.trainer} · ${b.timing} · ${formatDate(b.startDate)} → ${formatDate(b.endDate)}`}
                  trailing={
                    <div className="w-24 space-y-1">
                      <StatusBadge status={b.status} />
                      <Progress value={b.enrolled} max={b.capacity} />
                    </div>
                  }
                />
              ))}
            </RelatedCard>
            <RelatedCard title="Enrolled students" count={r.students.length} empty="No students enrolled yet.">
              {r.students.map((s) => (
                <RelatedRow
                  key={s.id}
                  href={`/students/${s.id}`}
                  leading={<Avatar name={s.name} />}
                  title={s.name}
                  sub={`${s.studentId} · ${s.batch}`}
                  trailing={<StatusBadge status={s.status} />}
                />
              ))}
            </RelatedCard>
          </>
        );
      }}
      aside={(c) => {
        const r = related(c);
        const seats = sum(r.batches, (b) => b.capacity);
        const filled = sum(r.batches, (b) => b.enrolled);
        return (
          <>
            <Card>
              <CardHeader title="Pricing" />
              <div className="bg-glow p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Course fee</p>
                <p className="font-display text-3xl font-bold text-brand-700">{formatCurrency(c.fee)}</p>
                <p className="text-xs text-stone-500">≈ {formatCurrency(Math.round(c.fee / Math.max(1, c.durationMonths)))} per month</p>
              </div>
              <InfoList
                items={[
                  { label: "Total seats", value: seats },
                  { label: "Seats filled", value: `${filled} (${seats ? Math.round((filled / seats) * 100) : 0}%)` },
                  { label: "Projected revenue", value: formatCompact(filled * c.fee) },
                ]}
              />
            </Card>
            <RelatedCard title="Interested leads" count={r.leads.length} empty="No open leads for this course.">
              {r.leads.map((l) => (
                <RelatedRow key={l.id} href={`/leads/${l.id}`} leading={<Avatar name={l.name} size="sm" />} title={l.name} sub={`${l.source} · ${l.assignedTo}`} trailing={<StatusBadge status={l.status} />} />
              ))}
            </RelatedCard>
          </>
        );
      }}
    />
  );
}
