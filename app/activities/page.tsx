import type { Metadata } from "next";
import { ActivitiesView } from "@/components/followups/ActivitiesView";

export const metadata: Metadata = { title: "Activities" };

export default function ActivitiesPage() {
  return <ActivitiesView />;
}
