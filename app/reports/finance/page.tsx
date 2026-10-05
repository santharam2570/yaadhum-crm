import type { Metadata } from "next";
import { FinanceReport } from "@/components/reports/ReportViews";

export const metadata: Metadata = { title: "Finance Report" };

export default function FinanceReportPage() {
  return <FinanceReport />;
}
