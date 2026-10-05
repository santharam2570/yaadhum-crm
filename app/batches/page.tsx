import type { Metadata } from "next";
import { BatchesView } from "@/components/batches/BatchesView";

export const metadata: Metadata = { title: "Batches" };

export default function BatchesPage() {
  return <BatchesView />;
}
