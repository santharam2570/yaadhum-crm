import type { Metadata } from "next";
import { LeadDetail } from "@/components/leads/LeadDetail";

export const metadata: Metadata = { title: "Lead details" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDetail id={id} />;
}
