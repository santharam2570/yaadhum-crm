import type { Metadata } from "next";
import { FollowupDetail } from "@/components/followups/FollowupDetail";

export const metadata: Metadata = { title: "Follow-up details" };

export default async function FollowupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FollowupDetail id={id} />;
}
