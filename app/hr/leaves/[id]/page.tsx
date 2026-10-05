import type { Metadata } from "next";
import { LeaveDetail } from "@/components/hr/leaves/LeaveDetail";

export const metadata: Metadata = { title: "Leave request details" };

export default async function LeaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeaveDetail id={id} />;
}
