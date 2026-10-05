"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Trash2, XOctagon } from "lucide-react";
import type { AppNotification } from "@/types/common";
import { markAllNotificationsRead, notificationService } from "@/services/adminService";
import { useResource } from "@/hooks/useResource";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState, Spinner } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";

const KIND_META: Record<AppNotification["kind"], { icon: typeof Info; tone: string }> = {
  info: { icon: Info, tone: "bg-sky-50 text-sky-600" },
  success: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  warning: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  alert: { icon: XOctagon, tone: "bg-brand-50 text-brand-600" },
};

export function NotificationsView() {
  const { data, loading, update, remove } = useResource(notificationService);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const rows = [...data]
    .filter((n) => tab === "all" || !n.read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = data.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Alerts and reminders from across the CRM."
        actions={
          <Button variant="secondary" icon={<CheckCheck className="h-4 w-4" />} disabled={!unread} onClick={markAllNotificationsRead}>
            Mark all as read
          </Button>
        }
      />
      <div className="mb-4 flex gap-2">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition",
              tab === t ? "bg-brand-gradient text-white ring-transparent" : "bg-white text-ink-700 ring-brand-100 hover:bg-brand-50",
            )}
          >
            {t === "all" ? `All (${data.length})` : `Unread (${unread})`}
          </button>
        ))}
      </div>
      <Card>
        {loading ? (
          <Spinner />
        ) : !rows.length ? (
          <EmptyState icon={Bell} title="You're all caught up" message="New alerts will show up here." />
        ) : (
          <ul className="divide-y divide-brand-50">
            {rows.map((n) => {
              const meta = KIND_META[n.kind];
              const Icon = meta.icon;
              return (
                <li key={n.id} className={cn("flex items-start gap-4 px-5 py-4 transition", !n.read && "bg-brand-50/30")}>
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/notifications/${n.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {n.title}
                      </Link>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    </div>
                    <p className="text-sm text-stone-600">{n.message}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs">
                      <span className="text-stone-400">{timeAgo(n.createdAt)}</span>
                      {n.link && (
                        <Link href={n.link} onClick={() => update(n.id, { read: true })} className="font-semibold text-brand-700 hover:underline">
                          Open
                        </Link>
                      )}
                      {!n.read && (
                        <button onClick={() => update(n.id, { read: true })} className="font-semibold text-stone-500 hover:text-ink-900">
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(n.id)}
                    className="rounded-md p-1.5 text-stone-400 transition hover:bg-brand-50 hover:text-brand-700"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
