import type { Metadata } from "next";
import { AnalyticsReport } from "@/components/reports/ReportViews";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <AnalyticsReport />;
}
