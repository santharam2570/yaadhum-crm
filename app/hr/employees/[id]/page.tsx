import type { Metadata } from "next";
import { EmployeeDetail } from "@/components/hr/employees/EmployeeDetail";

export const metadata: Metadata = { title: "Employee details" };

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetail id={id} />;
}
