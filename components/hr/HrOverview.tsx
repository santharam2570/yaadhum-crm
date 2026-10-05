"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarCheck, CalendarOff, IndianRupee, Users } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useResource } from "@/hooks/useResource";
import { holidayService, leaveService } from "@/services/leaveService";
import { formatCompact, formatDate, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { PersonCell } from "@/components/common/Cells";
import { Spinner } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatGrid } from "@/components/common/StatCard";
import { NAVIGATION } from "@/components/layout/navigation";
import { Bars, ChartCard, Donut } from "@/components/reports/Charts";

const HR_LINKS = NAVIGATION.flatMap((g) => g.items).find((i) => i.href === "/hr")?.children ?? [];

export function HrOverview() {
  const { data, loading } = useReports("hr");
  const { data: leaves } = useResource(leaveService);
  const { data: holidays } = useResource(holidayService);
  const today = todayISO();

  if (loading || !data) return <Spinner label="Loading HR overview…" />;

  const pending = leaves.filter((l) => l.status === "Pending");
  const upcoming = holidays.filter((h) => h.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <div>
      <PageHeader title="Human Resources" description="People operations at a glance." />

      <StatGrid
        items={[
          { label: "Employees", value: data.totals.employees, icon: Users, hint: `${data.totals.active} active` },
          { label: "Attendance Rate", value: `${data.totals.attendanceRate}%`, icon: CalendarCheck, accent: "ember", hint: "last 30 days" },
          { label: "Pending Leaves", value: data.totals.pendingLeaves, icon: CalendarOff, accent: "cream" },
          { label: "Monthly Payroll", value: formatCompact(data.totals.monthlyPayroll), icon: IndianRupee, accent: "dark" },
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {HR_LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-brand-100/70 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-gradient group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-ink-800">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Daily attendance" description="Present vs absent — last 14 working days" className="xl:col-span-2">
          <Bars
            data={data.attendanceTrend}
            series={[
              { key: "value", label: "Present" },
              { key: "absent", label: "Absent / Leave", color: "#f3cf94" },
            ]}
            stacked
          />
        </ChartCard>
        <ChartCard title="Headcount by department">
          <Donut data={data.byDepartment} centerLabel="People" height={200} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Pending leave requests"
            action={
              <Link href="/hr/leaves" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                Review <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-brand-50">
            {!pending.length && <li className="px-5 py-8 text-center text-sm text-stone-500">No pending requests 🎉</li>}
            {pending.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <PersonCell name={l.employeeName} sub={`${l.type} · ${l.days} day${l.days > 1 ? "s" : ""} from ${formatDate(l.from)}`} />
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title="Upcoming holidays"
            action={
              <Link href="/hr/holidays" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                Calendar <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-brand-50">
            {upcoming.map((h) => {
              const d = new Date(h.date);
              return (
                <li key={h.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-brand-gradient text-white">
                    <span className="text-[9px] font-bold uppercase">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                    <span className="font-display text-lg font-bold leading-none">{d.getDate()}</span>
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink-900">{h.name}</p>
                    <p className="text-xs text-stone-500">{d.toLocaleDateString("en-IN", { weekday: "long" })}</p>
                  </div>
                  <StatusBadge status={h.type} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
