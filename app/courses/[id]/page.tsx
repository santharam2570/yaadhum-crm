import type { Metadata } from "next";
import { CourseDetail } from "@/components/courses/CourseDetail";

export const metadata: Metadata = { title: "Course details" };

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetail id={id} />;
}
