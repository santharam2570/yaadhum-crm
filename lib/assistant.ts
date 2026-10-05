import { NAVIGATION } from "@/components/layout/navigation";
import { getSession } from "@/lib/auth";
import { can, roleLabel, type ModuleKey, type RoleKey } from "@/lib/permissions";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { admissionService } from "@/services/admissionService";
import { batchService } from "@/services/batchService";
import { courseService } from "@/services/courseService";
import { employeeService } from "@/services/employeeService";
import { followupService, taskService } from "@/services/followupService";
import { leadService } from "@/services/leadService";
import { leaveService } from "@/services/leaveService";
import { onboardingService, ONBOARDING_STAGES } from "@/services/onboardingService";
import { feeService, feeStatus, paymentService } from "@/services/paymentService";
import { payrollService } from "@/services/payrollService";
import { studentService } from "@/services/studentService";
import type { Admission } from "@/types/admission";
import type { Batch } from "@/types/batch";
import type { Followup, Task } from "@/types/common";
import type { Course } from "@/types/course";
import type { Employee } from "@/types/employee";
import type { Lead } from "@/types/lead";
import type { Leave } from "@/types/leave";
import type { Onboarding } from "@/types/onboarding";
import type { FeeAccount, Payment } from "@/types/payment";
import type { Payroll } from "@/types/payroll";
import type { Student } from "@/types/student";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  text: string;
  suggestions?: string[];
}

export interface CrmSnapshot {
  today: string;
  user: { name: string; role: RoleKey; roleLabel: string };
  leads?: Lead[];
  onboarding?: Onboarding[];
  followups?: Followup[];
  tasks?: Task[];
  students?: Student[];
  admissions?: Admission[];
  courses?: Course[];
  batches?: Batch[];
  employees?: Employee[];
  leaves?: Leave[];
  payroll?: Payroll[];
  fees?: FeeAccount[];
  payments?: Payment[];
}

export const STARTER_PROMPTS = [
  "Give me today's summary",
  "Today's follow-ups",
  "Outstanding fees",
  "Onboarding status",
  "Top counsellor",
  "Pending leave requests",
];

/** Loads every collection the current role is allowed to view. */
export async function buildSnapshot(): Promise<CrmSnapshot> {
  const session = getSession();
  const role = session?.role ?? "counsellor";
  const allow = (m: ModuleKey) => can(role, m);
  const load = <T>(m: ModuleKey, fn: () => Promise<T[]>) => (allow(m) ? fn() : Promise.resolve(undefined));

  const [leads, onboarding, followups, tasks, students, admissions, courses, batches, employees, leaves, payroll, fees, payments] =
    await Promise.all([
      load("leads", leadService.list),
      load("onboarding", onboardingService.list),
      load("followups", followupService.list),
      load("tasks", taskService.list),
      load("students", studentService.list),
      load("admissions", admissionService.list),
      load("courses", courseService.list),
      load("batches", batchService.list),
      load("hr", employeeService.list),
      load("hr", leaveService.list),
      load("hr", payrollService.list),
      load("fees", feeService.list),
      load("payments", paymentService.list),
    ]);

  return {
    today: todayISO(),
    user: { name: session?.name ?? "User", role, roleLabel: roleLabel(role) },
    leads,
    onboarding,
    followups,
    tasks,
    students,
    admissions,
    courses,
    batches,
    employees,
    leaves,
    payroll,
    fees: fees?.map((f) => ({ ...f, status: feeStatus(f) })),
    payments,
  };
}

const balance = (f: FeeAccount) => Math.max(0, f.totalFee - f.discount - f.paid);
const link = (label: string, href: string) => `[${label}](${href})`;
const bullets = (lines: string[]) => lines.map((l) => `- ${l}`).join("\n");
const count = <T>(rows: T[], fn: (r: T) => boolean) => rows.filter(fn).length;

function tally<T>(rows: T[], key: (r: T) => string) {
  const out = new Map<string, number>();
  for (const r of rows) out.set(key(r), (out.get(key(r)) ?? 0) + 1);
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
}

const noAccess = (what: string): AssistantReply => ({
  text: `Your role doesn't have access to **${what}**, so I can't answer that. Ask an administrator if you need it.`,
});

const RECORD_ROUTES = {
  lead: "/leads",
  student: "/students",
  employee: "/hr/employees",
  onboarding: "/onboarding",
  fee: "/fees",
} as const;

/** Compact JSON for the AI model: drops noisy fields and adds links. */
export function snapshotForAi(s: CrmSnapshot) {
  const cap = <T>(rows: T[] | undefined, n = 60) => rows?.slice(0, n);
  return JSON.stringify({
    today: s.today,
    user: s.user,
    leads: cap(s.leads)?.map((l) => ({ name: l.name, status: l.status, course: l.courseInterest, source: l.source, counsellor: l.assignedTo, created: l.createdAt.slice(0, 10), href: `${RECORD_ROUTES.lead}/${l.id}` })),
    onboarding: cap(s.onboarding)?.map((o) => ({ name: o.candidateName, stage: o.stage, course: o.course, owner: o.owner, target: o.targetDate, href: `${RECORD_ROUTES.onboarding}/${o.id}` })),
    followups: cap(s.followups)?.map((f) => ({ lead: f.leadName, type: f.type, due: f.dueDate, time: f.dueTime, owner: f.assignedTo, status: f.status, href: `/followups/${f.id}` })),
    tasks: cap(s.tasks)?.map((t) => ({ title: t.title, priority: t.priority, status: t.status, due: t.dueDate, assignee: t.assignee, href: `/tasks/${t.id}` })),
    students: cap(s.students)?.map((st) => ({ name: st.name, id: st.studentId, course: st.course, batch: st.batch, status: st.status, href: `${RECORD_ROUTES.student}/${st.id}` })),
    admissions: cap(s.admissions)?.map((a) => ({ name: a.studentName, course: a.course, status: a.status, applied: a.appliedOn, href: `/admissions/${a.id}` })),
    courses: s.courses?.map((c) => ({ name: c.name, fee: c.fee, months: c.durationMonths, mode: c.mode, status: c.status })),
    batches: s.batches?.map((b) => ({ name: b.name, course: b.course, trainer: b.trainer, status: b.status, seats: `${b.enrolled}/${b.capacity}`, href: `/batches/${b.id}` })),
    employees: cap(s.employees)?.map((e) => ({ name: e.name, department: e.department, designation: e.designation, status: e.status, href: `${RECORD_ROUTES.employee}/${e.id}` })),
    leaves: cap(s.leaves)?.map((l) => ({ employee: l.employeeName, type: l.type, from: l.from, to: l.to, days: l.days, status: l.status, href: `/hr/leaves/${l.id}` })),
    payroll: cap(s.payroll)?.map((p) => ({ employee: p.employeeName, month: p.month, netPay: p.netPay, status: p.status })),
    fees: cap(s.fees)?.map((f) => ({ student: f.studentName, course: f.course, total: f.totalFee - f.discount, paid: f.paid, balance: balance(f), due: f.dueDate, status: f.status, href: `${RECORD_ROUTES.fee}/${f.id}` })),
    payments: cap(s.payments)?.map((p) => ({ student: p.studentName, amount: p.amount, mode: p.mode, date: p.date, status: p.status })),
  });
}

/* ------------------------------------------------------------------ */
/* Built-in (offline) answer engine                                    */
/* ------------------------------------------------------------------ */

function navTargets(role: RoleKey) {
  const out: { label: string; href: string }[] = [];
  for (const g of NAVIGATION) {
    for (const item of g.items) {
      if (!can(role, item.module)) continue;
      out.push({ label: item.label, href: item.href });
      for (const c of item.children ?? []) {
        out.push({ label: item.module === "reports" ? `${c.label} report` : c.label, href: c.href });
      }
    }
  }
  return out;
}

function findPeople(q: string, s: CrmSnapshot) {
  const people: { kind: keyof typeof RECORD_ROUTES; name: string; id: string }[] = [
    ...(s.students ?? []).map((r) => ({ kind: "student" as const, name: r.name, id: r.id })),
    ...(s.leads ?? []).map((r) => ({ kind: "lead" as const, name: r.name, id: r.id })),
    ...(s.employees ?? []).map((r) => ({ kind: "employee" as const, name: r.name, id: r.id })),
  ];
  const full = people.filter((p) => q.includes(p.name.toLowerCase()));
  if (full.length) return full;
  const words = new Set(q.split(/[^a-z]+/).filter((w) => w.length >= 4));
  return people.filter((p) => p.name.toLowerCase().split(" ").some((part) => words.has(part)));
}

function describePerson(p: ReturnType<typeof findPeople>[number], s: CrmSnapshot): string {
  const href = `${RECORD_ROUTES[p.kind]}/${p.id}`;
  if (p.kind === "student") {
    const st = s.students!.find((r) => r.id === p.id)!;
    const fee = s.fees?.find((f) => f.studentName === st.name);
    const lines = [
      `Student ID ${st.studentId} · ${st.course} · batch ${st.batch || "—"}`,
      `Status: **${st.status}** · enrolled ${formatDate(st.enrollmentDate)}`,
    ];
    if (fee) lines.push(`Fees: paid ${formatCurrency(fee.paid)}, balance **${formatCurrency(balance(fee))}** (${fee.status}, due ${formatDate(fee.dueDate)})`);
    lines.push(`${link("Open profile", href)} · ${link("Printable report", `${href}/report`)}`);
    return `**${st.name}** (student)\n${bullets(lines)}`;
  }
  if (p.kind === "lead") {
    const l = s.leads!.find((r) => r.id === p.id)!;
    const next = s.followups
      ?.filter((f) => f.leadName === l.name && f.status === "Scheduled")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const ob = s.onboarding?.find((o) => o.leadId === l.id || o.candidateName === l.name);
    const lines = [
      `Status: **${l.status}** · ${l.courseInterest} · source ${l.source}`,
      `Counsellor: ${l.assignedTo} · ${l.phone}`,
    ];
    if (next) lines.push(`Next follow-up: ${next.type} on ${formatDate(next.dueDate)}${next.dueTime ? ` at ${next.dueTime}` : ""}`);
    if (ob) lines.push(`Onboarding: **${ob.stage}** · ${link("open", `/onboarding/${ob.id}`)}`);
    lines.push(`${link("Open lead", href)} · ${link("Printable report", `${href}/report`)}`);
    return `**${l.name}** (lead)\n${bullets(lines)}`;
  }
  const e = s.employees!.find((r) => r.id === p.id)!;
  const pending = count(s.leaves ?? [], (lv) => lv.employeeName === e.name && lv.status === "Pending");
  return `**${e.name}** (employee)\n${bullets([
    `${e.designation} · ${e.department} · ${e.employeeId}`,
    `Status: **${e.status}** · joined ${formatDate(e.joiningDate)}`,
    pending ? `${pending} leave request(s) waiting for approval` : "No pending leave requests",
    `${link("Open profile", href)} · ${link("Printable report", `${href}/report`)}`,
  ])}`;
}

const HELP: AssistantReply = {
  text: [
    "Vanakkam! I'm the **Yaadhum assistant**. I read your live CRM data and can answer things like:",
    bullets([
      "**Summary**: \"today's summary\"",
      "**Leads & onboarding**: \"how many leads\", \"onboarding status\", \"top counsellor\"",
      "**Follow-ups & tasks**: \"today's follow-ups\", \"overdue tasks\"",
      "**Finance**: \"outstanding fees\", \"overdue fees\", \"collection this month\"",
      "**HR**: \"pending leaves\", \"payroll status\", \"employees by department\"",
      "**People**: type a name, e.g. \"Arjun\"",
      "**Navigation**: \"open payroll\", \"go to fees\"",
    ]),
  ].join("\n"),
  suggestions: STARTER_PROMPTS,
};

export function answerLocally(question: string, s: CrmSnapshot): AssistantReply {
  const q = question.toLowerCase().trim();
  const today = s.today;
  const month = today.slice(0, 7);
  const is = (re: RegExp) => re.test(q);

  if (!q || is(/^(hi|hii+|hello|hey|vanakkam|help|menu|\?)\b|what can you do|how to use/)) return HELP;

  // Navigation
  const nav = q.match(/^(?:open|go to|goto|navigate to|take me to|show page)\s+(?:the\s+)?(.+?)(?:\s+page)?$/);
  if (nav) {
    const target = nav[1];
    const pages = navTargets(s.user.role);
    const hit =
      pages.find((p) => p.label.toLowerCase() === target) ??
      pages.find((p) => p.label.toLowerCase().startsWith(target)) ??
      pages.find((p) => target.includes(p.label.toLowerCase().replace(/-/g, "")) || target.includes(p.label.toLowerCase()));
    if (hit) return { text: `Here you go → ${link(hit.label, hit.href)}` };
    return { text: `I couldn't find a page called "${target}" that your role can open.` };
  }

  const isCount = is(/how many|count|total|number of|evlo|ethana|eththanai/);

  // People lookup (skip for pure counting questions)
  if (!isCount) {
    const people = findPeople(q, s);
    if (people.length === 1) return { text: describePerson(people[0], s) };
    if (people.length > 1 && people.length <= 6) {
      return {
        text: `I found ${people.length} matches:\n${bullets(people.map((p) => `${link(p.name, `${RECORD_ROUTES[p.kind]}/${p.id}`)} (${p.kind})`))}`,
        suggestions: people.slice(0, 3).map((p) => p.name),
      };
    }
  }

  if (is(/leave/)) {
    if (!s.leaves) return noAccess("HR");
    const pending = s.leaves.filter((l) => l.status === "Pending");
    const onLeave = s.leaves.filter((l) => l.status === "Approved" && l.from <= today && l.to >= today);
    return {
      text: [
        `**${pending.length}** leave request(s) waiting for approval.`,
        pending.length ? bullets(pending.slice(0, 8).map((l) => `${link(l.employeeName, `/hr/leaves/${l.id}`)}: ${l.type}, ${l.days} day(s) from ${formatDate(l.from)}`)) : "",
        `On leave today: **${onLeave.length}**${onLeave.length ? ` (${onLeave.map((l) => l.employeeName).join(", ")})` : ""}.`,
        link("Open leave management", "/hr/leaves"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/payroll|salary|salaries|payslip/)) {
    if (!s.payroll) return noAccess("HR");
    const months = [...new Set(s.payroll.map((p) => p.month))];
    const latest = months[months.length - 1];
    const rows = s.payroll.filter((p) => p.month === latest);
    const by = (st: string) => rows.filter((p) => p.status === st);
    const total = rows.reduce((a, p) => a + p.netPay, 0);
    return {
      text: [
        `**Payroll for ${latest}**: ${rows.length} payslips, total net pay **${formatCurrency(total)}**.`,
        bullets([`Pending: ${by("Pending").length}`, `Processed: ${by("Processed").length}`, `Paid: ${by("Paid").length}`]),
        link("Open payroll", "/hr/payroll"),
      ].join("\n"),
    };
  }

  if (is(/follow/)) {
    if (!s.followups) return noAccess("Follow-ups");
    const scheduled = s.followups.filter((f) => f.status === "Scheduled");
    const due = scheduled.filter((f) => f.dueDate === today).sort((a, b) => (a.dueTime ?? "").localeCompare(b.dueTime ?? ""));
    const overdue = scheduled.filter((f) => f.dueDate < today);
    const fmt = (f: Followup) => `${link(f.leadName, `/followups/${f.id}`)}: ${f.type}${f.dueTime ? ` at ${f.dueTime}` : ""} (${f.assignedTo})`;
    return {
      text: [
        `**${due.length}** follow-up(s) today${overdue.length ? `, **${overdue.length}** overdue` : ""}.`,
        due.length ? bullets(due.slice(0, 8).map(fmt)) : "Nothing scheduled for today.",
        overdue.length ? `\n**Overdue**\n${bullets(overdue.slice(0, 5).map((f) => `${fmt(f)}, due ${formatDate(f.dueDate)}`))}` : "",
        link("Open follow-ups", "/followups"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/task|todo|to-do/)) {
    if (!s.tasks) return noAccess("Tasks");
    const open = s.tasks.filter((t) => t.status !== "Done");
    const overdue = open.filter((t) => t.dueDate < today);
    const urgent = open.filter((t) => t.priority === "Urgent" || t.priority === "High");
    const list = (is(/overdue|late/) ? overdue : urgent.length ? urgent : open).slice(0, 8);
    return {
      text: [
        `**${open.length}** open task(s): ${overdue.length} overdue, ${urgent.length} high/urgent.`,
        list.length ? bullets(list.map((t) => `${link(t.title, `/tasks/${t.id}`)}: ${t.priority}, due ${formatDate(t.dueDate)} (${t.assignee})`)) : "",
        link("Open tasks", "/tasks"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/onboard|pipeline|convert/)) {
    if (!s.onboarding) return noAccess("Onboarding");
    const active = s.onboarding.filter((o) => o.stage !== "Completed" && o.stage !== "Dropped");
    const late = active.filter((o) => o.targetDate < today);
    const stages = ONBOARDING_STAGES.map((st) => `${st}: ${count(s.onboarding!, (o) => o.stage === st)}`);
    return {
      text: [
        `**${active.length}** candidate(s) in onboarding${late.length ? `, **${late.length}** past target date` : ""}.`,
        bullets(stages),
        late.length ? `\n**Needs attention**\n${bullets(late.slice(0, 5).map((o) => `${link(o.candidateName, `/onboarding/${o.id}`)}: ${o.stage}, target ${formatDate(o.targetDate)}`))}` : "",
        link("Open onboarding board", "/onboarding"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/fee|due|outstanding|balance|pending amount|pending payment|unpaid|overdue/)) {
    if (!s.fees) return noAccess("Fees");
    const open = s.fees.filter((f) => balance(f) > 0);
    const overdue = open.filter((f) => f.status === "Overdue");
    const total = open.reduce((a, f) => a + balance(f), 0);
    const list = (is(/overdue|late/) ? overdue : open).sort((a, b) => balance(b) - balance(a)).slice(0, 8);
    return {
      text: [
        `Outstanding fees: **${formatCurrency(total)}** across ${open.length} student(s). Overdue: **${overdue.length}** (${formatCurrency(overdue.reduce((a, f) => a + balance(f), 0))}).`,
        list.length ? bullets(list.map((f) => `${link(f.studentName, `/fees/${f.id}`)}: ${formatCurrency(balance(f))} (${f.status}, due ${formatDate(f.dueDate)})`)) : "",
        link("Open fees", "/fees"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/revenue|collection|collected|income|payment|earning/)) {
    if (!s.payments) return noAccess("Payments");
    const ok = s.payments.filter((p) => p.status === "Success");
    const thisMonth = ok.filter((p) => p.date.startsWith(month));
    const modes = tally(thisMonth, (p) => p.mode).map(([m, n]) => `${m}: ${n}`);
    return {
      text: [
        `Collected this month: **${formatCurrency(thisMonth.reduce((a, p) => a + p.amount, 0))}** from ${thisMonth.length} payment(s).`,
        `All-time collection: **${formatCurrency(ok.reduce((a, p) => a + p.amount, 0))}**.`,
        modes.length ? `By mode: ${modes.join(", ")}` : "",
        `Pending/failed payments: ${count(s.payments, (p) => p.status === "Pending" || p.status === "Failed")}`,
        link("Open payments", "/payments"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/admission|application/)) {
    if (!s.admissions) return noAccess("Admissions");
    const waiting = s.admissions.filter((a) => a.status === "Pending" || a.status === "Under Review");
    return {
      text: [
        `**${s.admissions.length}** application(s): ${tally(s.admissions, (a) => a.status).map(([k, n]) => `${k} ${n}`).join(", ")}.`,
        waiting.length ? `\n**Waiting for decision**\n${bullets(waiting.slice(0, 6).map((a) => `${link(a.studentName, `/admissions/${a.id}`)}: ${a.course}`))}` : "",
        link("Open admissions", "/admissions"),
      ].filter(Boolean).join("\n"),
    };
  }

  if (is(/counsel+or|top performer|leaderboard|best (staff|performer)|who converted/)) {
    if (!s.leads) return noAccess("Leads");
    const rows = tally(s.leads.filter((l) => l.status === "Converted"), (l) => l.assignedTo);
    if (!rows.length) return { text: "No converted leads yet." };
    return {
      text: [
        `🏆 **${rows[0][0]}** leads with **${rows[0][1]}** conversion(s).`,
        bullets(rows.map(([name, n]) => {
          const totalLeads = count(s.leads!, (l) => l.assignedTo === name);
          return `${name}: ${n} converted of ${totalLeads} (${Math.round((n / totalLeads) * 100)}%)`;
        })),
      ].join("\n"),
    };
  }

  if (is(/batch|seat/)) {
    if (!s.batches) return noAccess("Batches");
    const running = s.batches.filter((b) => b.status !== "Completed");
    return {
      text: [
        `**${running.length}** active batch(es):`,
        bullets(running.slice(0, 10).map((b) => `${link(b.name, `/batches/${b.id}`)}: ${b.status}, ${b.enrolled}/${b.capacity} seats, ${b.trainer}`)),
        link("Open batches", "/batches"),
      ].join("\n"),
    };
  }

  if (is(/course|fee structure/)) {
    if (!s.courses) return noAccess("Courses");
    return {
      text: [
        `**${s.courses.length}** course(s):`,
        bullets(s.courses.map((c) => `${link(c.name, `/courses/${c.id}`)}: ${formatCurrency(c.fee)}, ${c.durationMonths} month(s), ${c.mode}`)),
      ].join("\n"),
    };
  }

  if (is(/employee|staff|team|department|\bhr\b/)) {
    if (!s.employees) return noAccess("HR");
    return {
      text: [
        `**${s.employees.length}** employee(s), ${count(s.employees, (e) => e.status === "Active")} active, ${count(s.employees, (e) => e.status === "On Leave")} on leave.`,
        bullets(tally(s.employees, (e) => e.department).map(([d, n]) => `${d}: ${n}`)),
        link("Open employees", "/hr/employees"),
      ].join("\n"),
    };
  }

  if (is(/student/)) {
    if (!s.students) return noAccess("Students");
    return {
      text: [
        `**${s.students.length}** student(s): ${tally(s.students, (r) => r.status).map(([k, n]) => `${k} ${n}`).join(", ")}.`,
        `**By course**\n${bullets(tally(s.students, (r) => r.course).slice(0, 7).map(([c, n]) => `${c}: ${n}`))}`,
        link("Open students", "/students"),
      ].join("\n"),
    };
  }

  if (is(/lead|enquir|inquir|prospect/)) {
    if (!s.leads) return noAccess("Leads");
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    return {
      text: [
        `**${s.leads.length}** lead(s): ${tally(s.leads, (l) => l.status).map(([k, n]) => `${k} ${n}`).join(", ")}.`,
        `New in the last 7 days: **${count(s.leads, (l) => l.createdAt.slice(0, 10) >= weekAgo)}**.`,
        `**Top sources**: ${tally(s.leads, (l) => l.source).slice(0, 4).map(([k, n]) => `${k} (${n})`).join(", ")}`,
        link("Open leads", "/leads"),
      ].join("\n"),
    };
  }

  if (is(/summary|overview|today|brief|dashboard|status|update/)) {
    const lines: string[] = [];
    if (s.leads) lines.push(`Leads: ${s.leads.length} total, ${count(s.leads, (l) => l.status === "New")} new`);
    if (s.onboarding) lines.push(`In onboarding: ${count(s.onboarding, (o) => o.stage !== "Completed" && o.stage !== "Dropped")}`);
    if (s.followups) lines.push(`Follow-ups today: ${count(s.followups, (f) => f.status === "Scheduled" && f.dueDate === today)}`);
    if (s.tasks) lines.push(`Open tasks: ${count(s.tasks, (t) => t.status !== "Done")} (${count(s.tasks, (t) => t.status !== "Done" && t.dueDate < today)} overdue)`);
    if (s.students) lines.push(`Active students: ${count(s.students, (r) => r.status === "Active")}`);
    if (s.admissions) lines.push(`Admissions waiting: ${count(s.admissions, (a) => a.status === "Pending" || a.status === "Under Review")}`);
    if (s.fees) lines.push(`Outstanding fees: ${formatCurrency(s.fees.reduce((a, f) => a + balance(f), 0))}`);
    if (s.payments) lines.push(`Collected this month: ${formatCurrency(s.payments.filter((p) => p.status === "Success" && p.date.startsWith(month)).reduce((a, p) => a + p.amount, 0))}`);
    if (s.leaves) lines.push(`Leave requests pending: ${count(s.leaves, (l) => l.status === "Pending")}`);
    return { text: `**Summary for ${formatDate(today)}**\n${bullets(lines)}`, suggestions: STARTER_PROMPTS.slice(1, 5) };
  }

  return {
    text: "Sorry, I didn't catch that. Try one of these, or type a person's name.\n\n_Tip: add an OpenAI or Gemini key in `.env.local` to unlock free-form AI answers._",
    suggestions: STARTER_PROMPTS,
  };
}
