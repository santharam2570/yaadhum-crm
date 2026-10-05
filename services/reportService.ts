import { groupCount, lastMonths, monthKey, sum, todayISO } from "@/lib/utils";
import { admissionService } from "./admissionService";
import { attendanceService } from "./attendanceService";
import { batchService } from "./batchService";
import { employeeService } from "./employeeService";
import { activityService, followupService, taskService } from "./followupService";
import { leadService, LEAD_SOURCES, LEAD_STATUSES } from "./leadService";
import { leaveService } from "./leaveService";
import { ONBOARDING_STAGES, onboardingService } from "./onboardingService";
import { feeService, paymentService } from "./paymentService";
import { payrollService } from "./payrollService";
import { studentService } from "./studentService";

export interface ChartPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

const toPoints = (counts: Record<string, number>, order?: string[]): ChartPoint[] =>
  (order ?? Object.keys(counts)).map((name) => ({ name, value: counts[name] ?? 0 }));

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export async function getDashboardSummary() {
  const [leads, students, admissions, payments, fees, followups, tasks, onboarding, activities, batches] =
    await Promise.all([
      leadService.list(),
      studentService.list(),
      admissionService.list(),
      paymentService.list(),
      feeService.list(),
      followupService.list(),
      taskService.list(),
      onboardingService.list(),
      activityService.list(),
      batchService.list(),
    ]);

  const months = lastMonths(6);
  const success = payments.filter((p) => p.status === "Success");
  const revenueByMonth = months.map((m) => ({
    name: m,
    revenue: sum(success.filter((p) => monthKey(p.date) === m), (p) => p.amount),
    leads: leads.filter((l) => monthKey(l.createdAt) === m).length,
    admissions: admissions.filter((a) => monthKey(a.appliedOn) === m).length,
    value: 0,
  }));

  const thisMonth = months[months.length - 1];
  const today = todayISO();
  const activeOnboarding = onboarding.filter((o) => o.stage !== "Completed" && o.stage !== "Dropped");

  return {
    kpis: {
      totalLeads: leads.length,
      newLeadsThisMonth: leads.filter((l) => monthKey(l.createdAt) === thisMonth).length,
      activeStudents: students.filter((s) => s.status === "Active").length,
      totalStudents: students.length,
      conversionRate: pct(leads.filter((l) => l.status === "Converted").length, leads.length),
      revenueThisMonth: sum(success.filter((p) => monthKey(p.date) === thisMonth), (p) => p.amount),
      totalRevenue: sum(success, (p) => p.amount),
      outstandingFees: sum(fees, (f) => Math.max(0, f.totalFee - f.discount - f.paid)),
      onboardingActive: activeOnboarding.length,
      onboardingPastTarget: activeOnboarding.filter((o) => o.targetDate < today).length,
      pendingAdmissions: admissions.filter((a) => a.status === "Pending" || a.status === "Under Review").length,
      ongoingBatches: batches.filter((b) => b.status === "Ongoing").length,
    },
    revenueByMonth,
    leadsBySource: toPoints(groupCount(leads, (l) => l.source), LEAD_SOURCES).filter((p) => p.value > 0),
    leadsByStatus: toPoints(groupCount(leads, (l) => l.status), LEAD_STATUSES),
    onboardingByStage: ONBOARDING_STAGES.filter((s) => s !== "Dropped").map((stage) => ({
      name: stage,
      value: onboarding.filter((o) => o.stage === stage).length,
    })),
    upcomingFollowups: followups
      .filter((f) => f.status === "Scheduled" && f.dueDate >= today)
      .sort((a, b) => (a.dueDate + (a.dueTime ?? "")).localeCompare(b.dueDate + (b.dueTime ?? "")))
      .slice(0, 5),
    openTasks: tasks
      .filter((t) => t.status !== "Done")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5),
    recentActivities: [...activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6),
    recentPayments: success.slice(0, 5),
  };
}

export async function getCrmReport() {
  const [leads, onboarding, followups] = await Promise.all([
    leadService.list(),
    onboardingService.list(),
    followupService.list(),
  ]);
  const months = lastMonths(6);
  const byCounsellor = groupCount(leads, (l) => l.assignedTo);
  return {
    totals: {
      leads: leads.length,
      converted: leads.filter((l) => l.status === "Converted").length,
      conversionRate: pct(leads.filter((l) => l.status === "Converted").length, leads.length),
      onboarded: onboarding.filter((o) => o.stage === "Completed").length,
      followupCompletion: pct(
        followups.filter((f) => f.status === "Completed").length,
        followups.filter((f) => f.status !== "Scheduled").length,
      ),
    },
    leadsByStatus: toPoints(groupCount(leads, (l) => l.status), LEAD_STATUSES),
    leadsBySource: toPoints(groupCount(leads, (l) => l.source), LEAD_SOURCES),
    leadsTrend: months.map((m) => ({
      name: m,
      value: leads.filter((l) => monthKey(l.createdAt) === m).length,
      converted: leads.filter((l) => monthKey(l.createdAt) === m && l.status === "Converted").length,
    })),
    onboardingByStage: ONBOARDING_STAGES.map((stage) => ({
      name: stage,
      value: onboarding.filter((o) => o.stage === stage).length,
    })),
    counsellors: Object.entries(byCounsellor).map(([name, total]) => ({
      name,
      value: total,
      converted: leads.filter((l) => l.assignedTo === name && l.status === "Converted").length,
    })),
  };
}

export async function getStudentReport() {
  const [students, admissions, batches] = await Promise.all([
    studentService.list(),
    admissionService.list(),
    batchService.list(),
  ]);
  return {
    totals: {
      students: students.length,
      active: students.filter((s) => s.status === "Active").length,
      completed: students.filter((s) => s.status === "Completed").length,
      dropRate: pct(students.filter((s) => s.status === "Dropped").length, students.length),
      admissions: admissions.length,
    },
    byCourse: toPoints(groupCount(students, (s) => s.course)),
    byStatus: toPoints(groupCount(students, (s) => s.status)),
    admissionsByStatus: toPoints(groupCount(admissions, (a) => a.status)),
    batchUtilization: batches.map((b) => ({
      name: b.name,
      value: b.enrolled,
      capacity: b.capacity,
      utilization: pct(b.enrolled, b.capacity),
    })),
  };
}

export async function getHrReport() {
  const [employees, attendance, leaves, payroll] = await Promise.all([
    employeeService.list(),
    attendanceService.list(),
    leaveService.list(),
    payrollService.list(),
  ]);
  const dates = [...new Set(attendance.map((a) => a.date))].sort().slice(-14);
  const payrollMonths = [...new Set(payroll.map((p) => p.month))];
  return {
    totals: {
      employees: employees.length,
      active: employees.filter((e) => e.status === "Active").length,
      attendanceRate: pct(
        attendance.filter((a) => a.status === "Present" || a.status === "Late").length,
        attendance.length,
      ),
      pendingLeaves: leaves.filter((l) => l.status === "Pending").length,
      monthlyPayroll: sum(employees, (e) => e.salary),
    },
    byDepartment: toPoints(groupCount(employees, (e) => e.department)),
    attendanceByStatus: toPoints(groupCount(attendance, (a) => a.status)),
    attendanceTrend: dates.map((d) => {
      const day = attendance.filter((a) => a.date === d);
      return {
        name: new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: day.filter((a) => a.status === "Present" || a.status === "Late").length,
        absent: day.filter((a) => a.status === "Absent" || a.status === "Leave").length,
      };
    }),
    leavesByType: toPoints(groupCount(leaves, (l) => l.type)),
    payrollByMonth: payrollMonths.map((m) => ({
      name: m,
      value: sum(payroll.filter((p) => p.month === m), (p) => p.netPay),
    })),
  };
}

export async function getFinanceReport() {
  const [payments, fees] = await Promise.all([paymentService.list(), feeService.list()]);
  const success = payments.filter((p) => p.status === "Success");
  const months = lastMonths(6);
  const byCourse = success.reduce<Record<string, number>>((acc, p) => {
    acc[p.course] = (acc[p.course] ?? 0) + p.amount;
    return acc;
  }, {});
  const byMode = success.reduce<Record<string, number>>((acc, p) => {
    acc[p.mode] = (acc[p.mode] ?? 0) + p.amount;
    return acc;
  }, {});
  return {
    totals: {
      collected: sum(success, (p) => p.amount),
      outstanding: sum(fees, (f) => Math.max(0, f.totalFee - f.discount - f.paid)),
      overdueCount: fees.filter((f) => f.status === "Overdue").length,
      transactions: payments.length,
      avgTicket: success.length ? Math.round(sum(success, (p) => p.amount) / success.length) : 0,
    },
    revenueTrend: months.map((m) => ({
      name: m,
      value: sum(success.filter((p) => monthKey(p.date) === m), (p) => p.amount),
    })),
    byCourse: toPoints(byCourse),
    byMode: toPoints(byMode),
    feeStatus: toPoints(groupCount(fees, (f) => f.status), ["Paid", "Partial", "Unpaid", "Overdue"]),
    overdue: fees.filter((f) => f.status === "Overdue"),
  };
}

export async function getAnalyticsReport() {
  const [leads, admissions, students, payments] = await Promise.all([
    leadService.list(),
    admissionService.list(),
    studentService.list(),
    paymentService.list(),
  ]);
  const months = lastMonths(6);
  const success = payments.filter((p) => p.status === "Success");
  return {
    funnel: [
      { name: "Leads", value: leads.length },
      { name: "Contacted", value: leads.filter((l) => l.status !== "New").length },
      { name: "Qualified", value: leads.filter((l) => ["Qualified", "Converted"].includes(l.status)).length },
      { name: "Applications", value: admissions.length },
      { name: "Enrolled", value: admissions.filter((a) => a.status === "Enrolled").length + students.length },
    ],
    growth: months.map((m) => ({
      name: m,
      value: leads.filter((l) => monthKey(l.createdAt) === m).length,
      admissions: admissions.filter((a) => monthKey(a.appliedOn) === m).length,
      enrolments: students.filter((s) => monthKey(s.enrollmentDate) === m).length,
      revenue: sum(success.filter((p) => monthKey(p.date) === m), (p) => p.amount),
    })),
    sourceConversion: LEAD_SOURCES.map((src) => {
      const total = leads.filter((l) => l.source === src).length;
      const conv = leads.filter((l) => l.source === src && l.status === "Converted").length;
      return { name: src, value: total, converted: conv, rate: pct(conv, total) };
    }).filter((r) => r.value > 0),
    revenuePerStudent: students.length ? Math.round(sum(success, (p) => p.amount) / students.length) : 0,
  };
}
