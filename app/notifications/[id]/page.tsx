import type { Metadata } from "next";
import { NotificationDetail } from "../NotificationDetail";

export const metadata: Metadata = { title: "Notification details" };

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NotificationDetail id={id} />;
}
