import type { Metadata } from "next";
import { CrmReport } from "@/components/reports/ReportViews";

export const metadata: Metadata = { title: "CRM Report" };

export default function CrmReportPage() {
  return <CrmReport />;
}
