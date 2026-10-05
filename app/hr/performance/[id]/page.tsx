import type { Metadata } from "next";
import { PerformanceDetail } from "@/components/hr/performance/PerformanceDetail";

export const metadata: Metadata = { title: "Performance review details" };

export default async function PerformanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PerformanceDetail id={id} />;
}
