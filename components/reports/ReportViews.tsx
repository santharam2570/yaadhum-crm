"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CircleDollarSign,
  GraduationCap,
  IndianRupee,
  Percent,
  Printer,
  Receipt,
  Rocket,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { formatCompact, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { PersonCell, Progress } from "@/components/common/Cells";
import { Spinner } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatGrid } from "@/components/common/StatCard";
import { Bars, ChartCard, Donut, Funnel, TrendArea } from "./Charts";

const CRUMBS = [{ label: "Reports", href: "/reports" }];

function PrintButton() {
  return (
    <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
      Print
    </Button>
  );
}

const REPORTS = [
  { href: "/reports/crm", title: "CRM Report", description: "Leads, sources, conversions and onboarding.", icon: Target },
  { href: "/reports/students", title: "Student Report", description: "Enrolments, course mix, admissions and batch utilisation.", icon: GraduationCap },
  { href: "/reports/hr", title: "HR Report", description: "Headcount, attendance, leave patterns and payroll cost.", icon: Briefcase },
  { href: "/reports/finance", title: "Finance Report", description: "Collections, outstanding fees and revenue mix.", icon: Wallet },
  { href: "/reports/analytics", title: "Analytics", description: "Funnel, growth trends and source effectiveness.", icon: Activity },
];

export function ReportsIndex() {
  return (
    <div>
      <PageHeader title="Reports" description="Insights across every part of Yaadhum — pick a report to dive in." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-brand-100/70 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-50 transition group-hover:bg-brand-100" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md shadow-brand-900/20">
              <Icon className="h-6 w-6" />
            </span>
            <p className="relative mt-4 font-display text-xl font-bold text-ink-900">{title}</p>
            <p className="relative mt-1 text-sm text-stone-500">{description}</p>
            <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Open report <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CrmReport() {
  const { data } = useReports("crm");
  if (!data) return <Spinner />;
  return (
    <div>
      <PageHeader title="CRM Report" description="Lead generation and sales performance." breadcrumbs={[...CRUMBS, { label: "CRM" }]} actions={<PrintButton />} />
      <StatGrid
        items={[
          { label: "Total Leads", value: data.totals.leads, icon: Users },
          { label: "Converted", value: data.totals.converted, icon: UserCheck, accent: "ember" },
          { label: "Conversion Rate", value: `${data.totals.conversionRate}%`, icon: Percent, accent: "cream" },
          { label: "Onboarded", value: data.totals.onboarded, icon: Rocket, accent: "dark", hint: `${data.totals.followupCompletion}% follow-ups completed` },
        ]}
      />
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Lead inflow" description="New vs converted leads by month" className="xl:col-span-2">
          <TrendArea data={data.leadsTrend} series={[{ key: "value", label: "New leads" }, { key: "converted", label: "Converted" }]} />
        </ChartCard>
        <ChartCard title="Lead status">
          <Donut data={data.leadsByStatus} centerLabel="Leads" height={200} />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Leads by source">
          <Bars data={data.leadsBySource} series={[{ key: "value", label: "Leads" }]} colorByIndex />
        </ChartCard>
        <ChartCard title="Onboarding by stage" description="Converted leads moving towards enrolment">
          <Bars data={data.onboardingByStage} series={[{ key: "value", label: "Candidates" }]} horizontal colorByIndex />
        </ChartCard>
        <Card className="xl:col-span-2">
          <CardHeader title="Counsellor leaderboard" description="Leads handled and converted" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50/70 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3">Counsellor</th>
                  <th className="px-5 py-3">Leads</th>
                  <th className="px-5 py-3">Converted</th>
                  <th className="px-5 py-3">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {[...data.counsellors]
                  .sort((a, b) => b.converted - a.converted)
                  .map((c) => (
                    <tr key={c.name}>
                      <td className="px-5 py-3"><PersonCell name={c.name} /></td>
                      <td className="px-5 py-3 font-semibold">{c.value}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-700">{c.converted}</td>
                      <td className="px-5 py-3"><Progress value={c.converted} max={c.value} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function StudentsReport() {
  const { data } = useReports("students");
  if (!data) return <Spinner />;
  return (
    <div>
      <PageHeader title="Student Report" description="Enrolment and academic operations." breadcrumbs={[...CRUMBS, { label: "Students" }]} actions={<PrintButton />} />
      <StatGrid
        items={[
          { label: "Students", value: data.totals.students, icon: GraduationCap },
          { label: "Active", value: data.totals.active, icon: UserCheck, accent: "ember" },
          { label: "Completed", value: data.totals.completed, icon: TrendingUp, accent: "cream" },
          { label: "Drop Rate", value: `${data.totals.dropRate}%`, icon: Percent, accent: "dark", hint: `${data.totals.admissions} applications` },
        ]}
      />
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Students by course">
          <Bars data={data.byCourse} series={[{ key: "value", label: "Students" }]} horizontal colorByIndex />
        </ChartCard>
        <ChartCard title="Student status">
          <Donut data={data.byStatus} centerLabel="Students" />
        </ChartCard>
        <ChartCard title="Admissions pipeline">
          <Donut data={data.admissionsByStatus} centerLabel="Applications" />
        </ChartCard>
        <ChartCard title="Batch utilisation" description="Enrolled vs capacity">
          <Bars
            data={data.batchUtilization}
            series={[
              { key: "value", label: "Enrolled" },
              { key: "capacity", label: "Capacity", color: "#f3cf94" },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

export function HrReport() {
  const { data } = useReports("hr");
  if (!data) return <Spinner />;
  return (
    <div>
      <PageHeader title="HR Report" description="Workforce, attendance and payroll." breadcrumbs={[...CRUMBS, { label: "HR" }]} actions={<PrintButton />} />
      <StatGrid
        items={[
          { label: "Employees", value: data.totals.employees, icon: Users, hint: `${data.totals.active} active` },
          { label: "Attendance Rate", value: `${data.totals.attendanceRate}%`, icon: CalendarCheck, accent: "ember" },
          { label: "Pending Leaves", value: data.totals.pendingLeaves, icon: Briefcase, accent: "cream" },
          { label: "Monthly CTC", value: formatCompact(data.totals.monthlyPayroll), icon: IndianRupee, accent: "dark" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Attendance trend" description="Last 14 working days" className="xl:col-span-2">
          <TrendArea
            data={data.attendanceTrend}
            series={[
              { key: "value", label: "Present" },
              { key: "absent", label: "Absent / Leave", color: "#7a0a0e" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Attendance breakdown">
          <Donut data={data.attendanceByStatus} centerLabel="Records" />
        </ChartCard>
        <ChartCard title="Headcount by department">
          <Bars data={data.byDepartment} series={[{ key: "value", label: "Employees" }]} horizontal colorByIndex />
        </ChartCard>
        <ChartCard title="Leave types">
          <Donut data={data.leavesByType} centerLabel="Requests" />
        </ChartCard>
        <ChartCard title="Payroll cost" description="Net pay by month">
          <Bars data={data.payrollByMonth} series={[{ key: "value", label: "Net pay" }]} money />
        </ChartCard>
      </div>
    </div>
  );
}

export function FinanceReport() {
  const { data } = useReports("finance");
  if (!data) return <Spinner />;
  return (
    <div>
      <PageHeader title="Finance Report" description="Collections, dues and revenue mix." breadcrumbs={[...CRUMBS, { label: "Finance" }]} actions={<PrintButton />} />
      <StatGrid
        items={[
          { label: "Collected", value: formatCompact(data.totals.collected), icon: IndianRupee },
          { label: "Outstanding", value: formatCompact(data.totals.outstanding), icon: CircleDollarSign, accent: "ember" },
          { label: "Avg. Ticket", value: formatCurrency(data.totals.avgTicket), icon: Receipt, accent: "cream", hint: `${data.totals.transactions} transactions` },
          { label: "Overdue Accounts", value: data.totals.overdueCount, icon: Wallet, accent: "dark" },
        ]}
      />
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Revenue trend" className="xl:col-span-2">
          <TrendArea data={data.revenueTrend} series={[{ key: "value", label: "Revenue" }]} money />
        </ChartCard>
        <ChartCard title="Payment modes">
          <Donut data={data.byMode} money centerLabel="Collected" height={200} />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue by course">
          <Bars data={data.byCourse} series={[{ key: "value", label: "Revenue" }]} money horizontal colorByIndex />
        </ChartCard>
        <ChartCard title="Fee account status">
          <Donut data={data.feeStatus} centerLabel="Accounts" />
        </ChartCard>
        <Card className="xl:col-span-2">
          <CardHeader title="Overdue accounts" description="Students with balance past due date" />
          <ul className="divide-y divide-brand-50">
            {!data.overdue.length && <li className="px-5 py-8 text-center text-sm text-stone-500">No overdue accounts 🎉</li>}
            {data.overdue.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <PersonCell name={f.studentName} sub={`${f.course} · due ${formatDate(f.dueDate)}`} />
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-brand-700">{formatCurrency(f.totalFee - f.discount - f.paid)}</span>
                  <StatusBadge status={f.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function AnalyticsReport() {
  const { data } = useReports("analytics");
  if (!data) return <Spinner />;
  return (
    <div>
      <PageHeader title="Analytics" description="End-to-end funnel and growth trends." breadcrumbs={[...CRUMBS, { label: "Analytics" }]} actions={<PrintButton />} />
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Conversion funnel" description="From enquiry to enrolment">
          <Funnel data={data.funnel} />
          <div className="mt-5 rounded-xl bg-glow p-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-brand-800">Revenue per student</p>
            <p className="font-display text-2xl font-bold text-brand-700">{formatCurrency(data.revenuePerStudent)}</p>
          </div>
        </ChartCard>
        <ChartCard title="Growth" description="Leads, applications and enrolments per month" className="xl:col-span-2">
          <Bars
            data={data.growth}
            series={[
              { key: "value", label: "Leads" },
              { key: "admissions", label: "Applications" },
              { key: "enrolments", label: "Enrolments" },
            ]}
            height={320}
          />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue growth">
          <TrendArea data={data.growth} series={[{ key: "revenue", label: "Revenue" }]} money />
        </ChartCard>
        <Card>
          <CardHeader title="Source effectiveness" description="Which channels convert best" />
          <ul className="divide-y divide-brand-50">
            {[...data.sourceConversion]
              .sort((a, b) => b.rate - a.rate)
              .map((s) => (
                <li key={s.name} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-28 text-sm font-semibold text-ink-900">{s.name}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${s.rate}%` }} />
                    </div>
                  </div>
                  <span className="w-24 text-right text-xs text-stone-500">
                    <b className="text-ink-900">{s.rate}%</b> of {s.value}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
