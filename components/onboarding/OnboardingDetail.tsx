"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Check, GraduationCap, Rocket, UserPlus, Wallet } from "lucide-react";
import type { Onboarding } from "@/types/onboarding";
import { moveOnboarding, ONBOARDING_FLOW, STAGE_HINT } from "@/services/onboardingService";
import { leadService } from "@/services/leadService";
import { feeService } from "@/services/paymentService";
import { studentService } from "@/services/studentService";
import { useResource } from "@/hooks/useResource";
import { cn, daysBetween, formatCurrency, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage, type DetailContext } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { onboardingConfig, onboardingProgress } from "./OnboardingView";

function Checklist({ row }: { row: Onboarding }) {
  const current = ONBOARDING_FLOW.indexOf(row.stage);
  return (
    <Card>
      <CardHeader title="Onboarding checklist" description={row.stage === "Dropped" ? "This candidate dropped out." : `${onboardingProgress(row.stage)}% complete`} />
      <ol className="divide-y divide-brand-50">
        {ONBOARDING_FLOW.map((s, i) => {
          const done = row.stage !== "Dropped" && (i < current || row.stage === "Completed");
          const active = s === row.stage && row.stage !== "Completed";
          return (
            <li key={s} className={cn("flex items-start gap-3 px-5 py-3", active && "bg-brand-50/40")}>
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-brand-gradient text-white" : active ? "bg-white text-brand-700 ring-2 ring-brand-500" : "bg-cream-100 text-stone-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="flex-1">
                <p className={cn("text-sm font-semibold", done || active ? "text-ink-900" : "text-stone-500")}>{s}</p>
                <p className="text-xs text-stone-500">{STAGE_HINT[s]}</p>
              </div>
              {active && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Current</span>}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function NextStepButton({ row, ctx }: { row: Onboarding; ctx: DetailContext<Onboarding> }) {
  if (!ctx.canEdit || row.stage === "Completed" || row.stage === "Dropped") return null;
  const next = ONBOARDING_FLOW[ONBOARDING_FLOW.indexOf(row.stage) + 1];
  return (
    <Button
      variant="dark"
      icon={next === "Completed" ? <GraduationCap className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      onClick={async () => {
        await moveOnboarding(row, next);
        ctx.toast(next === "Completed" ? `${row.candidateName} enrolled as a student` : `Moved to ${next}`);
      }}
    >
      {next === "Completed" ? "Complete & enrol" : `Next: ${next}`}
    </Button>
  );
}

function LinkedRecords({ row }: { row: Onboarding }) {
  const lead = useResource(leadService).data.find((l) => l.id === row.leadId || l.name === row.candidateName);
  const fee = useResource(feeService).data.find((f) => f.studentName === row.candidateName);
  const student = useResource(studentService).data.find((s) => s.name === row.candidateName);
  const links = [
    lead && <RelatedRow key="lead" href={`/leads/${lead.id}`} leading={<UserPlus className="h-4 w-4 text-brand-600" />} title="Original lead" sub={`${lead.source} · created by ${lead.assignedTo}`} trailing={<StatusBadge status={lead.status} />} />,
    fee && (
      <RelatedRow
        key="fee"
        href={`/fees/${fee.id}`}
        leading={<Wallet className="h-4 w-4 text-brand-600" />}
        title="Fee account"
        sub={`${formatCurrency(fee.paid)} of ${formatCurrency(fee.totalFee - fee.discount)} paid`}
        trailing={<StatusBadge status={fee.status} />}
      />
    ),
    student && <RelatedRow key="student" href={`/students/${student.id}`} leading={<GraduationCap className="h-4 w-4 text-brand-600" />} title="Student profile" sub={`${student.studentId} · ${student.batch}`} trailing={<StatusBadge status={student.status} />} />,
  ].filter(Boolean);
  return (
    <RelatedCard title="Linked records" empty="The fee account opens at Fee Payment; the student profile is created on completion.">
      {links}
    </RelatedCard>
  );
}

export function OnboardingDetail({ id }: { id: string }) {
  return (
    <DetailPage<Onboarding>
      {...onboardingConfig}
      basePath="/onboarding"
      id={id}
      listLabel="Onboarding"
      avatar="person"
      title={(r) => r.candidateName}
      subtitle={(r) => `${r.course}${r.batch ? ` · ${r.batch}` : ""}`}
      status={(r) => r.stage}
      contact={(r) => ({ email: r.email, phone: r.phone })}
      sections={[
        { title: "Candidate", items: ["candidateName", "phone", "email", "course"] },
        { title: "Onboarding", items: ["stage", "owner", "batch", "startDate", "targetDate", { key: "leadId", label: "Lead reference" }, "notes"] },
      ]}
      stats={(r) => {
        const today = todayISO();
        const open = r.stage !== "Completed" && r.stage !== "Dropped";
        const left = r.targetDate >= today ? daysBetween(today, r.targetDate) - 1 : -(daysBetween(r.targetDate, today) - 1);
        return [
          { label: "Progress", value: `${onboardingProgress(r.stage)}%`, icon: Rocket },
          { label: "Current stage", value: r.stage, icon: Check, accent: "ember" },
          { label: "Days in onboarding", value: daysBetween(r.startDate, today) - 1, icon: CalendarClock, accent: "cream" },
          { label: open ? (left >= 0 ? "Days to target" : "Days past target") : "Status", value: open ? Math.abs(left) : r.stage, icon: GraduationCap, accent: "dark" },
        ];
      }}
      actions={(r, ctx) => <NextStepButton row={r} ctx={ctx} />}
      main={(r) => <Checklist row={r} />}
      aside={(r) => (
        <>
          <EmployeeLinkCard title="Onboarding owner" name={r.owner} />
          <LinkedRecords row={r} />
          {r.stage !== "Completed" && (
            <Card>
              <CardHeader title="Tip" />
              <p className="p-5 text-sm text-stone-600">
                Change the stage from the dropdown next to the name, or use <b>Next</b>. Moving to <b>Fee Payment</b> opens a fee account, and <b>Completed</b> creates the
                student profile. See all candidates on the{" "}
                <Link href="/onboarding" className="font-semibold text-brand-700">
                  onboarding board
                </Link>
                .
              </p>
            </Card>
          )}
        </>
      )}
    />
  );
}
