"use client";

import { useMemo, useState } from "react";
import type { ActivityType } from "@/types/common";
import { activityService } from "@/services/followupService";
import { useResource } from "@/hooks/useResource";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/common/Card";
import { EmptyState, Spinner } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ACTIVITY_META, ActivityTimeline } from "@/components/dashboard/ActivityTimeline";

export function ActivitiesView() {
  const { data, loading } = useResource(activityService);
  const [type, setType] = useState<ActivityType | "all">("all");

  const groups = useMemo(() => {
    const rows = [...data]
      .filter((a) => type === "all" || a.type === type)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const map = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const day = formatDate(r.timestamp, { weekday: "long", day: "numeric", month: "long" });
      map.set(day, [...(map.get(day) ?? []), r]);
    });
    return [...map.entries()];
  }, [data, type]);

  return (
    <div>
      <PageHeader title="Activities" description="A live audit trail of everything happening across Yaadhum CRM." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...Object.keys(ACTIVITY_META)] as (ActivityType | "all")[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition",
              type === t ? "bg-brand-gradient text-white ring-transparent" : "bg-white text-ink-700 ring-brand-100 hover:bg-brand-50",
            )}
          >
            {t === "all" ? "All activity" : ACTIVITY_META[t].label}
          </button>
        ))}
      </div>
      <Card className="p-6">
        {loading ? (
          <Spinner />
        ) : !groups.length ? (
          <EmptyState title="No activity" message="Actions like new leads, payments and approvals will appear here." />
        ) : (
          <div className="space-y-8">
            {groups.map(([day, items]) => (
              <section key={day}>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{day}</p>
                <ActivityTimeline items={items} />
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
