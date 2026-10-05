import type { Metadata } from "next";
import { FeeDetail } from "@/components/payments/FeeDetail";

export const metadata: Metadata = { title: "Fee account details" };

export default async function FeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeeDetail id={id} />;
}
