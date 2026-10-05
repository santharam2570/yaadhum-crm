import type { Metadata } from "next";
import { PerformanceView } from "@/components/hr/performance/PerformanceView";

export const metadata: Metadata = { title: "Performance" };

export default function PerformancePage() {
  return <PerformanceView />;
}
