import type { Metadata } from "next";
import { LeadReport } from "@/components/leads/LeadReport";

export const metadata: Metadata = { title: "Lead report" };

export default async function LeadReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadReport id={id} />;
}
