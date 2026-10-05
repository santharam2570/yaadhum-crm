import type { Metadata } from "next";
import { DepartmentsView } from "@/components/hr/employees/DepartmentsView";

export const metadata: Metadata = { title: "Departments" };

export default function DepartmentsPage() {
  return <DepartmentsView />;
}
