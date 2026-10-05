import type { Metadata } from "next";
import { StudentDetail } from "@/components/students/StudentDetail";

export const metadata: Metadata = { title: "Student details" };

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetail id={id} />;
}
