import type { Metadata } from "next";
import { BatchDetail } from "@/components/batches/BatchDetail";

export const metadata: Metadata = { title: "Batch details" };

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BatchDetail id={id} />;
}
