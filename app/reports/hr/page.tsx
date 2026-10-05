import type { Metadata } from "next";
import { HrReport } from "@/components/reports/ReportViews";

export const metadata: Metadata = { title: "HR Report" };

export default function HrReportPage() {
  return <HrReport />;
}
