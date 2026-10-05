"use client";

import Link from "next/link";
import { BookOpen, PhoneCall, Rocket, UserCheck } from "lucide-react";
import type { Lead } from "@/types/lead";
import { admissionService } from "@/services/admissionService";
import { onboardingService } from "@/services/onboardingService";
import { courseService } from "@/services/courseService";
import { activityService, followupService } from "@/services/followupService";
import { useResource } from "@/hooks/useResource";
import { daysBetween, formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow, StatusStepper } from "@/components/common/Related";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ReportButton } from "@/components/reports/PersonReport";
import { convertLead, leadConfig } from "./LeadsView";

function LeadRelated({ lead }: { lead: Lead }) {
  const followups = useResource(followupService).data.filter((f) => f.leadName === lead.name);
  const activities = useResource(activityService).data.filter((a) => a.description.includes(lead.name));
  return (
    <>
      <Card>
        <CardHeader title="Lead journey" />
        <div className="overflow-x-auto p-5">
          <StatusStepper
            steps={["New", "Contacted", "Qualified", "Converted"]}
            current={lead.status === "Lost" ? "Qualified" : lead.status}
            failed={lead.status === "Lost"}
          />
          {lead.status === "Lost" && <p className="mt-3 text-xs font-semibold text-stone-500">This lead was marked as lost.</p>}
        </div>
      </Card>
      <RelatedCard
        title="Follow-ups"
        count={followups.length}
        empty="No follow-ups scheduled for this lead."
        action={
          <Link href="/followups" className="text-xs font-semibold text-brand-700">
            Schedule
          </Link>
        }
      >
        {followups
          .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
          .map((f) => (
            <RelatedRow
              key={f.id}
              href={`/followups/${f.id}`}
              leading={
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-ember-600">
                  <PhoneCall className="h-4 w-4" />
                </span>
              }
              title={`${f.type} · ${formatDate(f.dueDate)} ${f.dueTime ?? ""}`}
              sub={f.notes}
              trailing={<StatusBadge status={f.status} />}
            />
          ))}
      </RelatedCard>
      <Card>
        <CardHeader title="Activity" />
        <div className="p-5">
          {activities.length ? (
            <ActivityTimeline items={[...activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp))} />
          ) : (
            <p className="text-center text-sm text-stone-500">No activity recorded yet.</p>
          )}
        </div>
      </Card>
    </>
  );
}

function LeadAside({ lead }: { lead: Lead }) {
  const course = useResource(courseService).data.find((c) => c.name === lead.courseInterest);
  const applications = useResource(admissionService).data.filter((a) => a.studentName === lead.name);
  const onboarding = useResource(onboardingService).data.filter((o) => o.leadId === lead.id || o.candidateName === lead.name);
  return (
    <>
      <Card>
        <CardHeader title="Interested course" />
        {course ? (
          <Link href={`/courses/${course.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink-900">{course.name}</p>
              <p className="text-xs text-stone-500">
                {course.durationMonths} months · {course.mode}
              </p>
            </div>
            <p className="font-display text-lg font-bold text-brand-700">{formatCurrency(course.fee)}</p>
          </Link>
        ) : (
          <p className="p-5 text-sm text-stone-500">{lead.courseInterest}</p>
        )}
      </Card>
      <RelatedCard title="Onboarding" count={onboarding.length} empty="Convert this lead to start onboarding.">
        {onboarding.map((o) => (
          <RelatedRow key={o.id} href={`/onboarding/${o.id}`} leading={<Rocket className="h-4 w-4 text-brand-600" />} title={o.course} sub={`Owner ${o.owner}`} trailing={<StatusBadge status={o.stage} />} />
        ))}
      </RelatedCard>
      <RelatedCard title="Applications" count={applications.length} empty="No admission application yet.">
        {applications.map((a) => (
          <RelatedRow key={a.id} href={`/admissions/${a.id}`} title={a.applicationNo} sub={a.course} trailing={<StatusBadge status={a.status} />} />
        ))}
      </RelatedCard>
      <Card>
        <CardHeader title="Summary" />
        <InfoList
          items={[
            { label: "Lead age", value: `${daysBetween(lead.createdAt, todayISO())} days` },
            { label: "Owner", value: lead.assignedTo },
            { label: "Source", value: lead.source },
          ]}
        />
      </Card>
    </>
  );
}

export function LeadDetail({ id }: { id: string }) {
  return (
    <DetailPage<Lead>
      {...leadConfig}
      basePath="/leads"
      id={id}
      listLabel="Leads"
      avatar="person"
      title={(r) => r.name}
      subtitle={(r) => `${r.courseInterest} · ${r.city ?? "—"}`}
      status={(r) => r.status}
      contact={(r) => ({ email: r.email, phone: r.phone })}
      sections={[
        { title: "Contact information", items: ["name", "phone", "email", "city"] },
        { title: "Enquiry details", items: ["courseInterest", "source", "status", "assignedTo", "createdAt", "notes"] },
      ]}
      actions={(r, ctx) => (
        <>
          <ReportButton href={`/leads/${r.id}/report`} />
          {ctx.canEdit && r.status !== "Converted" && r.status !== "Lost" && (
            <Button
              variant="dark"
              icon={<UserCheck className="h-4 w-4" />}
              onClick={async () => {
                await convertLead(r);
                ctx.toast(`${r.name} converted. Onboarding started.`);
              }}
            >
              Convert
            </Button>
          )}
        </>
      )}
      main={(r) => <LeadRelated lead={r} />}
      aside={(r) => <LeadAside lead={r} />}
    />
  );
}
