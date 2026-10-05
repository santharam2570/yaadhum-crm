import type { Metadata } from "next";
import { ActivityDetail } from "@/components/followups/ActivityDetail";

export const metadata: Metadata = { title: "Activity details" };

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActivityDetail id={id} />;
}
