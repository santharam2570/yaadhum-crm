import type { Metadata } from "next";
import { EmployeesView } from "@/components/hr/employees/EmployeesView";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return <EmployeesView />;
}
