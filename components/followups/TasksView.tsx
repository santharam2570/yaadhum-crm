"use client";

import { AlertCircle, CheckCheck, Clock, ListTodo } from "lucide-react";
import type { Task } from "@/types/common";
import { taskService } from "@/services/followupService";
import { getEmployeeOptions } from "@/services/employeeService";
import { daysFromToday, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { DateText, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Todo", "In Progress", "Done"];
const AREAS = ["Leads", "Students", "Courses", "HR", "Finance", "Documents", "Marketing", "Reports", "Operations"];

export const taskConfig: ResourceConfig<Task> = {
  entityName: "Task",
  module: "tasks",
  service: taskService,
  basePath: "/tasks",
  fields: [
    { name: "title", label: "Title", required: true, colSpan: 2 },
    { name: "priority", label: "Priority", type: "select", required: true, options: PRIORITIES },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "dueDate", label: "Due date", type: "date", required: true },
    { name: "assignee", label: "Assignee", type: "select", required: true, optionsLoader: getEmployeeOptions },
    { name: "relatedTo", label: "Area", type: "select", options: AREAS },
    { name: "description", label: "Description", type: "textarea" },
  ],
  defaults: () => ({ priority: "Medium", status: "Todo", dueDate: daysFromToday(2) }),
};

export function TasksView() {
  const today = todayISO();
  return (
    <ResourcePage<Task>
      {...taskConfig}
      title="Tasks"
      description="Team to-dos with priorities and due dates."
      searchKeys={["title", "assignee", "relatedTo"]}
      filters={[
        { key: "status", label: "Statuses", options: STATUSES },
        { key: "priority", label: "Priorities", options: PRIORITIES },
      ]}
      stats={(rows) => [
        { label: "Open", value: rows.filter((r) => r.status !== "Done").length, icon: ListTodo },
        { label: "In Progress", value: rows.filter((r) => r.status === "In Progress").length, icon: Clock, accent: "ember" },
        { label: "Overdue", value: rows.filter((r) => r.status !== "Done" && r.dueDate < today).length, icon: AlertCircle, accent: "dark" },
        { label: "Completed", value: rows.filter((r) => r.status === "Done").length, icon: CheckCheck, accent: "cream" },
      ]}
      columns={[
        {
          key: "title",
          header: "Task",
          render: (r) => (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={r.status === "Done"}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => taskService.update(r.id, { status: e.target.checked ? "Done" : "Todo" })}
                className="h-4 w-4 rounded accent-brand-600"
              />
              <span className={r.status === "Done" ? "text-stone-400 line-through" : ""}>
                <TitleCell title={r.title} sub={r.relatedTo} />
              </span>
            </div>
          ),
        },
        { key: "priority", header: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        {
          key: "dueDate",
          header: "Due",
          render: (r) => (
            <span className={r.status !== "Done" && r.dueDate < today ? "font-semibold text-brand-700" : ""}>
              <DateText value={r.dueDate} />
            </span>
          ),
          hideBelow: "sm",
        },
        { key: "assignee", header: "Assignee", hideBelow: "md" },
      ]}
    />
  );
}
