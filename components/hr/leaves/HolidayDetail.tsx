"use client";

import { CalendarDays, CalendarRange, Hourglass, PartyPopper } from "lucide-react";
import type { Holiday } from "@/types/leave";
import { holidayService, leaveService } from "@/services/leaveService";
import { useResource } from "@/hooks/useResource";
import { cn, daysBetween, formatDate, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow } from "@/components/common/Related";
import { HR_CRUMBS } from "@/components/hr/employees/EmployeesView";
import { holidayConfig } from "./HolidaysView";

function countdown(date: string) {
  const today = todayISO();
  if (date === today) return "Today";
  if (date > today) return `In ${daysBetween(today, date) - 1} days`;
  return `${daysBetween(date, today) - 1} days ago`;
}

function DateTile({ date }: { date: string }) {
  const d = new Date(date);
  const past = date < todayISO();
  return (
    <Card className="overflow-hidden">
      <div className={cn("flex flex-col items-center py-6", past ? "bg-stone-100 text-stone-600" : "bg-brand-gradient text-white")}>
        <span className="text-xs font-bold uppercase tracking-widest">{d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
        <span className="font-display text-6xl font-bold leading-none">{d.getDate()}</span>
        <span className="mt-1 text-sm font-semibold">{d.toLocaleDateString("en-IN", { weekday: "long" })}</span>
      </div>
      <p className="py-3 text-center text-sm font-semibold text-ink-800">{countdown(date)}</p>
    </Card>
  );
}

export function HolidayDetail({ id }: { id: string }) {
  const holidays = useResource(holidayService).data;
  const leaves = useResource(leaveService).data;

  return (
    <DetailPage<Holiday>
      {...holidayConfig}
      basePath="/hr/holidays"
      parents={HR_CRUMBS}
      id={id}
      listLabel="Holidays"
      avatar={PartyPopper}
      title={(h) => h.name}
      subtitle={(h) => formatDate(h.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      status={(h) => h.type}
      sections={[{ title: "Holiday information", items: ["name", "date", "type", "description"] }]}
      stats={(h) => {
        const d = new Date(h.date);
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const sameMonth = holidays.filter((o) => o.date.slice(0, 7) === h.date.slice(0, 7)).length;
        return [
          { label: "Countdown", value: countdown(h.date), icon: Hourglass },
          { label: "Weekday", value: d.toLocaleDateString("en-IN", { weekday: "long" }), icon: CalendarDays, accent: "ember", hint: weekend ? "Falls on a weekend" : "Working day off" },
          { label: "Holidays this month", value: sameMonth, icon: CalendarRange, accent: "cream" },
          { label: "Holiday type", value: h.type, icon: PartyPopper, accent: "dark" },
        ];
      }}
      main={(h) => {
        const overlapping = leaves.filter((l) => l.status !== "Rejected" && l.from <= h.date && l.to >= h.date);
        return (
          <RelatedCard title="Leave requests covering this date" count={overlapping.length} empty="Nobody has leave around this holiday.">
            {overlapping.map((l) => (
              <RelatedRow key={l.id} href={`/hr/leaves/${l.id}`} title={l.employeeName} sub={`${l.type} · ${formatDate(l.from)} → ${formatDate(l.to)}`} trailing={<StatusBadge status={l.status} />} />
            ))}
          </RelatedCard>
        );
      }}
      aside={(h) => {
        const upcoming = holidays
          .filter((o) => o.id !== h.id && o.date >= todayISO())
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 6);
        return (
          <>
            <DateTile date={h.date} />
            <RelatedCard title="Upcoming holidays" count={upcoming.length} empty="No more holidays this year.">
              {upcoming.map((o) => (
                <RelatedRow key={o.id} href={`/hr/holidays/${o.id}`} title={o.name} sub={formatDate(o.date, { weekday: "short", day: "2-digit", month: "short" })} trailing={<StatusBadge status={o.type} />} />
              ))}
            </RelatedCard>
          </>
        );
      }}
    />
  );
}
