"use client";

import { CalendarDays, Flag, PartyPopper, Sparkles } from "lucide-react";
import type { Holiday } from "@/types/leave";
import { holidayService } from "@/services/leaveService";
import { cn, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig, type RowContext } from "@/components/common/ResourcePage";

const TYPES = ["Public", "Optional", "Company"];

export const holidayConfig: ResourceConfig<Holiday> = {
  entityName: "Holiday",
  module: "hr",
  service: holidayService,
  basePath: "/hr/holidays",
  fields: [
    { name: "name", label: "Holiday name", required: true },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "type", label: "Type", type: "select", required: true, options: TYPES },
    { name: "description", label: "Description", type: "textarea" },
  ],
  defaults: () => ({ type: "Public" }),
};

function HolidayCalendar({ rows, ctx }: { rows: Holiday[]; ctx: RowContext<Holiday> }) {
  const today = todayISO();
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((h) => {
        const d = new Date(h.date);
        const past = h.date < today;
        return (
          <button
            key={h.id}
            onClick={() => ctx.open(h)}
            className={cn(
              "flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-md",
              past ? "border-stone-100 opacity-60" : "border-brand-100/70",
            )}
          >
            <span className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl", past ? "bg-stone-100 text-stone-500" : "bg-brand-gradient text-white")}>
              <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
              <span className="font-display text-xl font-bold leading-none">{d.getDate()}</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-ink-900">{h.name}</span>
              <span className="block text-xs text-stone-500">{d.toLocaleDateString("en-IN", { weekday: "long" })}</span>
              <span className="mt-1 block">
                <StatusBadge status={h.type} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function HolidaysView() {
  const today = todayISO();
  return (
    <ResourcePage<Holiday>
      {...holidayConfig}
      title="Holidays"
      description={`Holiday calendar for ${new Date().getFullYear()} — Tamil Nadu public and company holidays.`}
      breadcrumbs={[{ label: "HR", href: "/hr" }, { label: "Holidays" }]}
      searchKeys={["name", "type"]}
      filters={[{ key: "type", label: "Types", options: TYPES }]}
      stats={(rows) => {
        const upcoming = rows.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date));
        return [
          { label: "Total Holidays", value: rows.length, icon: CalendarDays },
          { label: "Upcoming", value: upcoming.length, icon: PartyPopper, accent: "ember" },
          { label: "Next Holiday", value: upcoming[0]?.name ?? "—", icon: Sparkles, accent: "cream", hint: upcoming[0]?.date },
          { label: "Public", value: rows.filter((r) => r.type === "Public").length, icon: Flag, accent: "dark" },
        ];
      }}
      renderBoard={(rows, ctx) => <HolidayCalendar rows={rows} ctx={ctx} />}
      columns={[
        { key: "name", header: "Holiday", render: (r) => <TitleCell title={r.name} sub={r.description} /> },
        {
          key: "date",
          header: "Date",
          render: (r) => new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
        },
        { key: "type", header: "Type", render: (r) => <StatusBadge status={r.type} /> },
      ]}
    />
  );
}
