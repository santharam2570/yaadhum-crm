import type { Metadata } from "next";
import { AdmissionDetail } from "@/components/admissions/AdmissionDetail";

export const metadata: Metadata = { title: "Application details" };

export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdmissionDetail id={id} />;
}
