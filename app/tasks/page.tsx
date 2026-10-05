import type { Metadata } from "next";
import { TasksView } from "@/components/followups/TasksView";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <TasksView />;
}
