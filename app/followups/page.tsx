import type { Metadata } from "next";
import { FollowupsView } from "@/components/followups/FollowupsView";

export const metadata: Metadata = { title: "Follow-ups" };

export default function FollowupsPage() {
  return <FollowupsView />;
}
