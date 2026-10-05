"use client";

import Link from "next/link";
import { CheckCircle2, ListTodo, PlayCircle, RotateCcw } from "lucide-react";
import type { Task } from "@/types/common";
import { taskService } from "@/services/followupService";
import { employeeService } from "@/services/employeeService";
import { useResource } from "@/hooks/useResource";
import { formatDate, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { PersonCell } from "@/components/common/Cells";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow, StatusStepper } from "@/components/common/Related";
import { taskConfig } from "./TasksView";

function Assignee({ name }: { name: string }) {
  const emp = useResource(employeeService).data.find((e) => e.name === name);
  const tasks = useResource(taskService).data.filter((t) => t.assignee === name && t.status !== "Done");
  return (
    <>
      <Card>
        <CardHeader title="Assignee" />
        <div className="p-5">
          {emp ? (
            <Link href={`/hr/employees/${emp.id}`} className="block rounded-lg transition hover:bg-brand-50/40">
              <PersonCell name={emp.name} sub={`${emp.designation} · ${emp.department}`} />
            </Link>
          ) : (
            <PersonCell name={name} />
          )}
        </div>
      </Card>
      <RelatedCard title={`Open tasks for ${name.split(" ")[0]}`} count={tasks.length} empty="No other open tasks.">
        {tasks.map((t) => (
          <RelatedRow key={t.id} href={`/tasks/${t.id}`} title={t.title} sub={`Due ${formatDate(t.dueDate)}`} trailing={<StatusBadge status={t.priority} />} />
        ))}
      </RelatedCard>
    </>
  );
}

export function TaskDetail({ id }: { id: string }) {
  const today = todayISO();
  return (
    <DetailPage<Task>
      {...taskConfig}
      basePath="/tasks"
      id={id}
      listLabel="Tasks"
      avatar={ListTodo}
      title={(r) => r.title}
      subtitle={(r) => `${r.relatedTo ?? "General"} · due ${formatDate(r.dueDate)}${r.status !== "Done" && r.dueDate < today ? " (overdue)" : ""}`}
      status={(r) => r.status}
      sections={[
        { title: "Task details", items: ["title", "priority", "status", "dueDate", "assignee", "relatedTo"] },
        { title: "Description", items: ["description"] },
      ]}
      actions={(r, ctx) => {
        if (!ctx.canEdit) return null;
        if (r.status === "Todo")
          return (
            <Button variant="dark" icon={<PlayCircle className="h-4 w-4" />} onClick={() => ctx.update({ status: "In Progress" })}>
              Start
            </Button>
          );
        if (r.status === "In Progress")
          return (
            <Button variant="dark" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => ctx.update({ status: "Done" })}>
              Complete
            </Button>
          );
        return (
          <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => ctx.update({ status: "Todo" })}>
            Reopen
          </Button>
        );
      }}
      main={(r) => (
        <Card>
          <CardHeader title="Progress" />
          <div className="p-5">
            <StatusStepper steps={["Todo", "In Progress", "Done"]} current={r.status} />
          </div>
        </Card>
      )}
      aside={(r) => <Assignee name={r.assignee} />}
    />
  );
}
