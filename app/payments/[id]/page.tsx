import type { Metadata } from "next";
import { PaymentDetail } from "@/components/payments/PaymentDetail";

export const metadata: Metadata = { title: "Payment details" };

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaymentDetail id={id} />;
}
