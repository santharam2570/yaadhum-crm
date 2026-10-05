"use client";

import { Activity as ActivityIcon } from "lucide-react";
import type { Activity } from "@/types/common";
import { activityService } from "@/services/followupService";
import { useResource } from "@/hooks/useResource";
import { timeAgo } from "@/lib/utils";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { ACTIVITY_META, ActivityTimeline } from "@/components/dashboard/ActivityTimeline";

const TYPES = Object.keys(ACTIVITY_META);

function Related({ row }: { row: Activity }) {
  const items = useResource(activityService)
    .data.filter((a) => a.id !== row.id && (a.type === row.type || a.user === row.user))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);
  return (
    <Card>
      <CardHeader title="Related activity" description={`Same type or by ${row.user}`} />
      <div className="p-5">
        {items.length ? <ActivityTimeline items={items} compact /> : <p className="text-center text-sm text-stone-500">Nothing related.</p>}
      </div>
    </Card>
  );
}

export function ActivityDetail({ id }: { id: string }) {
  return (
    <DetailPage<Activity>
      entityName="Activity"
      module="activities"
      service={activityService}
      basePath="/activities"
      fields={[
        { name: "type", label: "Type", type: "select", required: true, options: TYPES },
        { name: "title", label: "Title", required: true },
        { name: "user", label: "Performed by", required: true },
        { name: "timestamp", label: "Timestamp", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
      ]}
      id={id}
      listLabel="Activities"
      avatar={ActivityIcon}
      title={(r) => r.title}
      subtitle={(r) => `${ACTIVITY_META[r.type]?.label ?? r.type} · ${r.user} · ${timeAgo(r.timestamp)}`}
      sections={[{ title: "Activity details", items: ["type", "title", "user", "timestamp", "description"] }]}
      main={(r) => <Related row={r} />}
    />
  );
}
