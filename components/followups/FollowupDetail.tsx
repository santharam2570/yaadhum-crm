"use client";

import Link from "next/link";
import { CheckCircle2, PhoneCall } from "lucide-react";
import type { Followup } from "@/types/common";
import { followupService } from "@/services/followupService";
import { leadService } from "@/services/leadService";
import { useResource } from "@/hooks/useResource";
import { formatDate, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { InfoList, RelatedCard, RelatedRow } from "@/components/common/Related";
import { completeFollowup, followupConfig } from "./FollowupsView";

function LeadCard({ name }: { name: string }) {
  const lead = useResource(leadService).data.find((l) => l.name === name);
  return (
    <Card>
      <CardHeader title="Lead" />
      {lead ? (
        <>
          <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 p-5 transition hover:bg-brand-50/40">
            <Avatar name={lead.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink-900">{lead.name}</p>
              <p className="truncate text-xs text-stone-500">{lead.courseInterest}</p>
            </div>
            <StatusBadge status={lead.status} />
          </Link>
          <InfoList
            items={[
              { label: "Phone", value: <a href={`tel:${lead.phone}`} className="text-brand-700">{lead.phone}</a> },
              { label: "Email", value: lead.email },
              { label: "Source", value: lead.source },
            ]}
          />
        </>
      ) : (
        <p className="p-5 text-sm text-stone-500">{name}</p>
      )}
    </Card>
  );
}

function History({ row }: { row: Followup }) {
  const others = useResource(followupService).data.filter((f) => f.leadName === row.leadName && f.id !== row.id);
  return (
    <RelatedCard title={`Other follow-ups with ${row.leadName}`} count={others.length} empty="This is the only follow-up for this lead.">
      {others
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
            title={`${f.type} · ${formatDate(f.dueDate)}`}
            sub={f.notes}
            trailing={<StatusBadge status={f.status} />}
          />
        ))}
    </RelatedCard>
  );
}

export function FollowupDetail({ id }: { id: string }) {
  const today = todayISO();
  return (
    <DetailPage<Followup>
      {...followupConfig}
      basePath="/followups"
      id={id}
      listLabel="Follow-ups"
      avatar={PhoneCall}
      title={(r) => `${r.type} with ${r.leadName}`}
      subtitle={(r) =>
        `${r.dueDate === today ? "Today" : formatDate(r.dueDate, { weekday: "long", day: "numeric", month: "long" })}${r.dueTime ? ` at ${r.dueTime}` : ""} · ${r.assignedTo}`
      }
      status={(r) => (r.status === "Scheduled" && r.dueDate < today ? "Overdue" : r.status)}
      sections={[
        { title: "Follow-up details", items: ["leadName", "type", "dueDate", "dueTime", "assignedTo", "status"] },
        { title: "Agenda & notes", items: ["notes"] },
      ]}
      actions={(r, ctx) =>
        ctx.canEdit && r.status === "Scheduled" ? (
          <Button
            variant="dark"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={async () => {
              await completeFollowup(r);
              ctx.toast("Follow-up marked as completed");
            }}
          >
            Mark done
          </Button>
        ) : null
      }
      main={(r) => <History row={r} />}
      aside={(r) => <LeadCard name={r.leadName} />}
    />
  );
}
