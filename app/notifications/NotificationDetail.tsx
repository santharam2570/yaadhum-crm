"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ExternalLink, MailOpen, MailWarning } from "lucide-react";
import type { AppNotification } from "@/types/common";
import { notificationService } from "@/services/adminService";
import { useResource } from "@/hooks/useResource";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow } from "@/components/common/Related";
import type { ResourceConfig } from "@/components/common/ResourcePage";

const KINDS = ["info", "success", "warning", "alert"];

export const notificationConfig: ResourceConfig<AppNotification> = {
  entityName: "Notification",
  module: "notifications",
  service: notificationService,
  basePath: "/notifications",
  fields: [
    { name: "title", label: "Title", required: true },
    { name: "kind", label: "Kind", type: "select", required: true, options: KINDS },
    { name: "message", label: "Message", type: "textarea", required: true },
    { name: "link", label: "Link", placeholder: "/fees" },
  ],
};

function OpenLinkButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <Button variant="dark" icon={<ExternalLink className="h-4 w-4" />} onClick={() => router.push(href)}>
      Open
    </Button>
  );
}

function MarkReadOnView({ row }: { row: AppNotification }) {
  useEffect(() => {
    if (!row.read) notificationService.update(row.id, { read: true });
  }, [row.id, row.read]);
  return null;
}

function OtherNotifications({ row }: { row: AppNotification }) {
  const others = useResource(notificationService)
    .data.filter((n) => n.id !== row.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  return (
    <RelatedCard title="Other notifications" count={others.length} empty="No other notifications.">
      {others.map((n) => (
        <RelatedRow
          key={n.id}
          href={`/notifications/${n.id}`}
          title={
            <span className="flex items-center gap-2">
              {n.title}
              {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
            </span>
          }
          sub={timeAgo(n.createdAt)}
        />
      ))}
    </RelatedCard>
  );
}

export function NotificationDetail({ id }: { id: string }) {
  return (
    <DetailPage<AppNotification>
      {...notificationConfig}
      basePath="/notifications"
      id={id}
      listLabel="Notifications"
      avatar={Bell}
      title={(n) => n.title}
      subtitle={(n) => timeAgo(n.createdAt)}
      status={(n) => (n.read ? "Read" : "Unread")}
      sections={[
        {
          title: "Notification",
          items: [
            "title",
            "kind",
            "message",
            { key: "read", label: "Read" },
            { key: "createdAt", label: "Received", type: "datetime" },
            { key: "link", label: "Link", render: (n) => (n.link ? <Link href={n.link} className="text-brand-700 hover:underline">{n.link}</Link> : "—") },
          ],
        },
      ]}
      actions={(n, ctx) => (
        <>
          {n.link && <OpenLinkButton href={n.link} />}
          {ctx.canEdit && (
            <Button
              variant="secondary"
              icon={n.read ? <MailWarning className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
              onClick={() => ctx.update({ read: !n.read })}
            >
              {n.read ? "Mark unread" : "Mark read"}
            </Button>
          )}
        </>
      )}
      main={(n) => (
        <Card>
          <CardHeader title="Message" />
          <p className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-ink-800">{n.message}</p>
          <MarkReadOnView row={n} />
        </Card>
      )}
      aside={(n) => <OtherNotifications row={n} />}
    />
  );
}
