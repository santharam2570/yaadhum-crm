import type { Metadata } from "next";
import { AdmissionsView } from "@/components/admissions/AdmissionsView";

export const metadata: Metadata = { title: "Admissions" };

export default function AdmissionsPage() {
  return <AdmissionsView />;
}
