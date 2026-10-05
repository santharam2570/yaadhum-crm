import type { Metadata } from "next";
import { PayrollView } from "@/components/hr/payroll/PayrollView";

export const metadata: Metadata = { title: "Payroll" };

export default function PayrollPage() {
  return <PayrollView />;
}
