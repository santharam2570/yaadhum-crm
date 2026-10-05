import type { Metadata } from "next";
import { PayrollDetail } from "@/components/hr/payroll/PayrollDetail";

export const metadata: Metadata = { title: "Payslip details" };

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PayrollDetail id={id} />;
}
