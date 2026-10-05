import type { Metadata } from "next";
import { OnboardingDetail } from "@/components/onboarding/OnboardingDetail";

export const metadata: Metadata = { title: "Onboarding details" };

export default async function OnboardingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OnboardingDetail id={id} />;
}
