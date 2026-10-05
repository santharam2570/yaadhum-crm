import type { Metadata } from "next";
import { StudentReport } from "@/components/students/StudentReport";

export const metadata: Metadata = { title: "Student report" };

export default async function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentReport id={id} />;
}
