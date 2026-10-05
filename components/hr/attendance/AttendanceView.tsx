"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCheck, ChevronLeft, ChevronRight, Clock, UserX, Users } from "lucide-react";
import type { AttendanceStatus } from "@/types/attendance";
import { useAttendance } from "@/hooks/useAttendance";
import { usePermission } from "@/hooks/usePermission";
import { cn, toISODate, todayISO } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { PersonCell } from "@/components/common/Cells";
import { Spinner } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatGrid } from "@/components/common/StatCard";
import { useToast } from "@/components/common/Toast";

const OPTIONS: { status: AttendanceStatus; short: string; active: string }[] = [
  { status: "Present", short: "P", active: "bg-emerald-600 text-white ring-emerald-600" },
  { status: "Late", short: "L", active: "bg-amber-500 text-white ring-amber-500" },
  { status: "Half Day", short: "H", active: "bg-ember-500 text-white ring-ember-500" },
  { status: "Absent", short: "A", active: "bg-brand-600 text-white ring-brand-600" },
  { status: "Leave", short: "LV", active: "bg-violet-600 text-white ring-violet-600" },
];

function shiftDate(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function AttendanceView() {
  const [date, setDate] = useState(todayISO());
  const { rows, summary, loading, mark, markAllPresent } = useAttendance(date);
  const { can } = usePermission();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const editable = can("hr", "edit");
  const isSunday = new Date(date).getDay() === 0;

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and review daily attendance for every team member."
        breadcrumbs={[{ label: "HR", href: "/hr" }, { label: "Attendance" }]}
        actions={
          editable && (
            <Button
              icon={<CheckCheck className="h-4 w-4" />}
              loading={busy}
              disabled={summary.unmarked === 0}
              onClick={async () => {
                setBusy(true);
                await markAllPresent();
                setBusy(false);
                toast("Remaining employees marked present");
              }}
            >
              Mark all present
            </Button>
          )
        }
      />

      <StatGrid
        items={[
          { label: "Team", value: summary.total, icon: Users, hint: `${summary.unmarked} not marked` },
          { label: "Present", value: summary.present + summary.late, icon: CalendarCheck, accent: "ember", hint: `${summary.late} late` },
          { label: "Half Day / Leave", value: summary.halfDay + summary.leave, icon: Clock, accent: "cream" },
          { label: "Absent", value: summary.absent, icon: UserX, accent: "dark" },
        ]}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-lg border border-brand-100 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <Button
              variant="secondary"
              size="icon"
              disabled={date >= todayISO()}
              onClick={() => setDate(shiftDate(date, 1))}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {date !== todayISO() && (
              <Button variant="ghost" size="sm" onClick={() => setDate(todayISO())}>
                Today
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-stone-500">
            {OPTIONS.map((o) => (
              <span key={o.status} className="flex items-center gap-1.5">
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold ring-1", o.active)}>{o.short}</span>
                {o.status}
              </span>
            ))}
          </div>
        </div>

        {isSunday && (
          <p className="border-b border-brand-50 bg-cream-50 px-4 py-2 text-xs font-medium text-brand-800">
            Sunday — weekly off. You can still record attendance for anyone who worked.
          </p>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <ul className="divide-y divide-brand-50">
            {rows.map(({ employee, record }) => (
              <li key={employee.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <Link href={`/hr/employees/${employee.id}`} className="flex-1 rounded-lg transition hover:opacity-80">
                  <PersonCell name={employee.name} sub={`${employee.designation} · ${employee.department}`} />
                </Link>
                <div className="w-28 text-xs text-stone-500">
                  {record?.checkIn ? (
                    <>
                      <span className="font-semibold text-ink-800">{record.checkIn}</span> – {record.checkOut ?? "…"}
                    </>
                  ) : (
                    <span className="italic">{record ? "—" : "Not marked"}</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {OPTIONS.map((o) => {
                    const active = record?.status === o.status;
                    return (
                      <button
                        key={o.status}
                        disabled={!editable}
                        title={o.status}
                        onClick={() => mark(employee, o.status)}
                        className={cn(
                          "h-8 min-w-9 rounded-lg px-2 text-xs font-bold ring-1 transition disabled:cursor-not-allowed",
                          active ? o.active : "bg-white text-stone-500 ring-brand-100 hover:bg-cream-50 hover:text-ink-900",
                        )}
                      >
                        {o.short}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
