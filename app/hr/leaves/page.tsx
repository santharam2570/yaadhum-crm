import type { Metadata } from "next";
import { LeavesView } from "@/components/hr/leaves/LeavesView";

export const metadata: Metadata = { title: "Leaves" };

export default function LeavesPage() {
  return <LeavesView />;
}
