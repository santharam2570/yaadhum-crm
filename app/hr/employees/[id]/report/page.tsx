import type { Metadata } from "next";
import { EmployeeReport } from "@/components/hr/employees/EmployeeReport";

export const metadata: Metadata = { title: "Employee report" };

export default async function EmployeeReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeReport id={id} />;
}
