import type { Metadata } from "next";
import { DepartmentDetail } from "@/components/hr/employees/DepartmentDetail";

export const metadata: Metadata = { title: "Department details" };

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DepartmentDetail id={id} />;
}
