import type { Metadata } from "next";
import { StudentsView } from "@/components/students/StudentsView";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return <StudentsView />;
}
