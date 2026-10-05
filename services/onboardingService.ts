import { createCollection } from "@/lib/api";
import { daysFromToday, pick, todayISO, toISODate } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import type { Onboarding, OnboardingStage } from "@/types/onboarding";
import { COURSE_CATALOG, courseService } from "./courseService";
import { logActivity } from "./followupService";
import { leadService, seedLeads } from "./leadService";
import { feeService } from "./paymentService";
import { studentService } from "./studentService";

export const ONBOARDING_STAGES: OnboardingStage[] = [
  "Welcome Call",
  "Documents",
  "Fee Payment",
  "Batch Allocation",
  "Orientation",
  "Completed",
  "Dropped",
];

/** The forward path, without the "Dropped" exit. */
export const ONBOARDING_FLOW: OnboardingStage[] = ONBOARDING_STAGES.filter((s) => s !== "Dropped");

export const STAGE_HINT: Record<OnboardingStage, string> = {
  "Welcome Call": "Call the candidate, confirm course, timing and fee plan.",
  Documents: "Collect ID proof, photo and qualification certificates.",
  "Fee Payment": "First installment collected against the fee account.",
  "Batch Allocation": "Assign a batch that matches their preferred timing.",
  Orientation: "Share LMS login, timetable and introduce the trainer.",
  Completed: "Onboarding done — the candidate is now an active student.",
  Dropped: "The candidate did not continue.",
};

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export const onboardingService = createCollection<Onboarding>("onboarding", () =>
  seedLeads()
    .filter((l) => l.status === "Converted")
    .map((l, i) => {
      const stage = pick(ONBOARDING_STAGES, i);
      const course = COURSE_CATALOG.find((c) => c.name === l.courseInterest) ?? COURSE_CATALOG[0];
      const startDate = addDays(l.createdAt, 3);
      const allocated = ONBOARDING_FLOW.indexOf(stage) >= ONBOARDING_FLOW.indexOf("Batch Allocation");
      return {
        id: `onb_${i + 1}`,
        candidateName: l.name,
        email: l.email,
        phone: l.phone,
        course: l.courseInterest,
        stage,
        owner: l.assignedTo,
        leadId: l.id,
        batch: allocated ? `${course.code}-2026-B${(i % 7) + 1}` : undefined,
        startDate,
        targetDate: addDays(startDate, 21),
        notes: i % 2 ? "Prefers evening batch." : "",
      };
    }),
);

/** Converts a lead: marks it converted and opens an onboarding record at the first stage. */
export async function startOnboarding(lead: Lead) {
  await leadService.update(lead.id, { status: "Converted" });
  const row = await onboardingService.create({
    candidateName: lead.name,
    email: lead.email,
    phone: lead.phone,
    course: lead.courseInterest,
    stage: "Welcome Call",
    owner: lead.assignedTo,
    leadId: lead.id,
    startDate: todayISO(),
    targetDate: daysFromToday(21),
    notes: lead.notes,
  });
  await logActivity("lead", "Lead converted", `${lead.name} converted — onboarding started for ${lead.courseInterest}.`, lead.assignedTo);
  return row;
}

/**
 * Moves an onboarding record to a stage and runs that stage's side effects:
 * a fee account is opened at "Fee Payment" and the student record is created at "Completed".
 */
export async function moveOnboarding(row: Onboarding, stage: OnboardingStage) {
  await onboardingService.update(row.id, { stage });
  const reached = (s: OnboardingStage) => stage !== "Dropped" && ONBOARDING_FLOW.indexOf(stage) >= ONBOARDING_FLOW.indexOf(s);

  if (reached("Fee Payment")) {
    const fees = await feeService.list();
    if (!fees.some((f) => f.studentName === row.candidateName)) {
      const course = (await courseService.list()).find((c) => c.name === row.course);
      await feeService.create({
        studentName: row.candidateName,
        course: row.course,
        totalFee: course?.fee ?? 0,
        discount: 0,
        paid: 0,
        installments: 3,
        dueDate: daysFromToday(7),
        status: "Unpaid",
      });
    }
  }

  if (stage === "Completed") {
    const students = await studentService.list();
    if (!students.some((s) => s.name === row.candidateName)) {
      await studentService.create({
        studentId: `YS26${Math.floor(200 + Math.random() * 800)}`,
        name: row.candidateName,
        email: row.email,
        phone: row.phone,
        course: row.course,
        batch: row.batch || "To be assigned",
        enrollmentDate: todayISO(),
        status: "Active",
      });
    }
    await logActivity("student", "Onboarding completed", `${row.candidateName} enrolled in ${row.course}.`, row.owner);
  } else if (stage === "Dropped") {
    await logActivity("lead", "Onboarding dropped", `${row.candidateName} dropped out during onboarding.`, row.owner);
  }
}
