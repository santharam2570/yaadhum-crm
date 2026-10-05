"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  GraduationCap,
  IndianRupee,
  Layers,
  PhoneCall,
  Rocket,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { formatCompact, formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Card, CardHeader } from "@/components/common/Card";
import { Spinner } from "@/components/common/EmptyState";
import { StatGrid } from "@/components/common/StatCard";
import { Bars, ChartCard, Donut, TrendArea } from "@/components/reports/Charts";
import { ActivityTimeline } from "./ActivityTimeline";
import { WelcomeBanner } from "./WelcomeBanner";

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
      View all <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function DashboardView() {
  const { data, loading } = useReports("dashboard");
  if (loading || !data) return <Spinner label="Loading dashboard…" />;
  const { kpis } = data;
  const today = todayISO();

  return (
    <div>
      <WelcomeBanner followupsToday={data.upcomingFollowups.filter((f) => f.dueDate === today).length} />

      <StatGrid
        items={[
          { label: "Total Leads", value: kpis.totalLeads, icon: UserPlus, hint: `${kpis.newLeadsThisMonth} new this month`, trend: 12 },
          { label: "Active Students", value: kpis.activeStudents, icon: GraduationCap, hint: `of ${kpis.totalStudents} enrolled`, accent: "dark" },
          { label: "Revenue (Month)", value: formatCompact(kpis.revenueThisMonth), icon: IndianRupee, hint: `${formatCompact(kpis.totalRevenue)} all time`, trend: 8, accent: "ember" },
          { label: "Conversion Rate", value: `${kpis.conversionRate}%`, icon: TrendingUp, hint: "lead → student", accent: "cream" },
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "In onboarding", value: kpis.onboardingActive, sub: `${kpis.onboardingPastTarget} past target date`, icon: Rocket, href: "/onboarding" },
          { label: "Outstanding fees", value: formatCompact(kpis.outstandingFees), sub: "to be collected", icon: Wallet, href: "/fees" },
          { label: "Pending admissions", value: kpis.pendingAdmissions, sub: "awaiting review", icon: ClipboardList, href: "/admissions" },
          { label: "Ongoing batches", value: kpis.ongoingBatches, sub: "running now", icon: Layers, href: "/batches" },
        ].map(({ label, value, sub, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-brand-100/70 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
              <span className="block font-display text-lg font-bold text-ink-900">{value}</span>
              <span className="block truncate text-[11px] text-stone-400">{sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Revenue trend" description="Fee collections over the last 6 months" className="xl:col-span-2">
          <TrendArea data={data.revenueByMonth} series={[{ key: "revenue", label: "Revenue" }]} money />
        </ChartCard>
        <ChartCard title="Lead sources" description="Where enquiries come from">
          <Donut data={data.leadsBySource} centerLabel="Leads" height={200} />
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Onboarding" description="Converted leads by onboarding stage" action={<ViewAll href="/onboarding" />}>
          <Bars data={data.onboardingByStage} series={[{ key: "value", label: "Candidates" }]} colorByIndex height={240} />
        </ChartCard>

        <Card>
          <CardHeader title="Upcoming follow-ups" description="Scheduled calls and meetings" action={<ViewAll href="/followups" />} />
          <ul className="divide-y divide-brand-50">
            {data.upcomingFollowups.length === 0 && <li className="px-5 py-8 text-center text-sm text-stone-500">All caught up!</li>}
            {data.upcomingFollowups.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-ember-600">
                  <PhoneCall className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{f.leadName}</p>
                  <p className="truncate text-xs text-stone-500">
                    {f.type} · {f.assignedTo}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className={f.dueDate === today ? "font-bold text-brand-700" : "font-semibold text-ink-800"}>
                    {f.dueDate === today ? "Today" : formatDate(f.dueDate, { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-stone-400">{f.dueTime}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Open tasks" description="Prioritised to-dos for the team" action={<ViewAll href="/tasks" />} />
          <ul className="divide-y divide-brand-50">
            {data.openTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{t.title}</p>
                  <p className="truncate text-xs text-stone-500">
                    {t.assignee} · due {formatDate(t.dueDate, { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <StatusBadge status={t.priority} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" description="Latest actions across Yaadhum" action={<ViewAll href="/activities" />} />
          <div className="p-5">
            <ActivityTimeline items={data.recentActivities} compact />
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent payments" description="Latest successful fee collections" action={<ViewAll href="/payments" />} />
          <ul className="divide-y divide-brand-50">
            {data.recentPayments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={p.studentName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{p.studentName}</p>
                  <p className="truncate text-xs text-stone-500">
                    {p.receiptNo} · {p.mode} · {formatDate(p.date)}
                  </p>
                </div>
                <p className="font-display text-base font-bold text-emerald-700">{formatCurrency(p.amount)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
