import type { Metadata } from "next";
import { TaskDetail } from "@/components/followups/TaskDetail";

export const metadata: Metadata = { title: "Task details" };

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetail id={id} />;
}
