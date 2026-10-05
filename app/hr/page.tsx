import type { Metadata } from "next";
import { HrOverview } from "@/components/hr/HrOverview";

export const metadata: Metadata = { title: "HR" };

export default function HrPage() {
  return <HrOverview />;
}
