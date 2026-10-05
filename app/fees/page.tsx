import type { Metadata } from "next";
import { FeesView } from "@/components/payments/FeesView";

export const metadata: Metadata = { title: "Fees" };

export default function FeesPage() {
  return <FeesView />;
}
