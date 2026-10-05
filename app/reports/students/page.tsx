import type { Metadata } from "next";
import { StudentsReport } from "@/components/reports/ReportViews";

export const metadata: Metadata = { title: "Student Report" };

export default function StudentsReportPage() {
  return <StudentsReport />;
}
