import type { Metadata } from "next";
import { HolidaysView } from "@/components/hr/leaves/HolidaysView";

export const metadata: Metadata = { title: "Holidays" };

export default function HolidaysPage() {
  return <HolidaysView />;
}
