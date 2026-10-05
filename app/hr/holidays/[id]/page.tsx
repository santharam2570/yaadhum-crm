import type { Metadata } from "next";
import { HolidayDetail } from "@/components/hr/leaves/HolidayDetail";

export const metadata: Metadata = { title: "Holiday details" };

export default async function HolidayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HolidayDetail id={id} />;
}
