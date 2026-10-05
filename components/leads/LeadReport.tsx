"use client";

import { activityService, followupService } from "@/services/followupService";
import { leadService } from "@/services/leadService";
import { onboardingService } from "@/services/onboardingService";
import { useResource } from "@/hooks/useResource";
import { daysBetween, formatDate, formatDateTime, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { ReportFields, ReportSection, ReportShell, ReportTable, ReportTiles } from "@/components/reports/PersonReport";

export function LeadReport({ id }: { id: string }) {
  const leads = useResource(leadService);
  const followups = useResource(followupService).data;
  const activities = useResource(activityService).data;
  const onboarding = useResource(onboardingService).data;

  const l = leads.data.find((r) => r.id === id);
  const fups = l ? followups.filter((f) => f.leadName === l.name).sort((a, b) => b.dueDate.localeCompare(a.dueDate)) : [];
  const acts = l ? activities.filter((a) => a.description.includes(l.name)).sort((a, b) => b.timestamp.localeCompare(a.timestamp)) : [];
  const onb = l ? onboarding.filter((o) => o.leadId === l.id || o.candidateName === l.name) : [];

  return (
    <ReportShell
      kind="Lead"
      name={l?.name}
      subtitle={l && `${l.courseInterest} · ${l.source}`}
      status={l?.status}
      backHref={`/leads/${id}`}
      loading={leads.loading}
      found={!!l}
    >
      {l && (
        <>
          <ReportTiles
            items={[
              { label: "Lead age", value: `${daysBetween(l.createdAt, todayISO())} days` },
              { label: "Follow-ups", value: fups.length },
              { label: "Completed", value: fups.filter((f) => f.status === "Completed").length, tone: "good" },
              { label: "Onboarding", value: onb[0]?.stage ?? "Not started" },
            ]}
          />
          <ReportSection title="Contact information">
            <ReportFields
              items={[
                { label: "Full name", value: l.name },
                { label: "Phone", value: l.phone },
                { label: "Email", value: l.email },
                { label: "City", value: l.city },
              ]}
            />
          </ReportSection>
          <ReportSection title="Enquiry details">
            <ReportFields
              items={[
                { label: "Course interested", value: l.courseInterest },
                { label: "Source", value: l.source },
                { label: "Status", value: l.status },
                { label: "Assigned to", value: l.assignedTo },
                { label: "Created on", value: formatDate(l.createdAt) },
                { label: "Notes", value: l.notes },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Follow-ups (${fups.length})`}>
            <ReportTable
              rows={fups}
              empty="No follow-ups."
              columns={[
                { header: "Date", cell: (f) => `${formatDate(f.dueDate)} ${f.dueTime ?? ""}` },
                { header: "Type", cell: (f) => f.type },
                { header: "Assigned to", cell: (f) => f.assignedTo },
                { header: "Notes", cell: (f) => f.notes || "—" },
                { header: "Status", cell: (f) => <StatusBadge status={f.status} /> },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Onboarding (${onb.length})`}>
            <ReportTable
              rows={onb}
              empty="Onboarding has not started."
              columns={[
                { header: "Course", cell: (o) => o.course },
                { header: "Owner", cell: (o) => o.owner },
                { header: "Started", cell: (o) => formatDate(o.startDate) },
                { header: "Target", cell: (o) => formatDate(o.targetDate) },
                { header: "Batch", cell: (o) => o.batch || "—" },
                { header: "Stage", cell: (o) => <StatusBadge status={o.stage} /> },
              ]}
            />
          </ReportSection>
          <ReportSection title={`Activity (${acts.length})`}>
            <ReportTable
              rows={acts}
              empty="No activity recorded."
              columns={[
                { header: "When", cell: (a) => formatDateTime(a.timestamp) },
                { header: "Activity", cell: (a) => a.title },
                { header: "Details", cell: (a) => a.description },
                { header: "By", cell: (a) => a.user },
              ]}
            />
          </ReportSection>
        </>
      )}
    </ReportShell>
  );
}
