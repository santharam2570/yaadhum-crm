"use client";

import Link from "next/link";
import { employeeService } from "@/services/employeeService";
import { useResource } from "@/hooks/useResource";
import { Card, CardHeader } from "@/components/common/Card";
import { PersonCell } from "@/components/common/Cells";

/** Card showing a staff member by name, linking to their employee profile when one exists. */
export function EmployeeLinkCard({ title, name, note }: { title: string; name: string; note?: string }) {
  const emp = useResource(employeeService).data.find((e) => e.name === name);
  return (
    <Card>
      <CardHeader title={title} />
      <div className="p-5">
        {emp ? (
          <Link href={`/hr/employees/${emp.id}`} className="block rounded-lg transition hover:bg-brand-50/40">
            <PersonCell name={emp.name} sub={note ?? `${emp.designation} · ${emp.department}`} />
          </Link>
        ) : (
          <PersonCell name={name} sub={note} />
        )}
      </div>
    </Card>
  );
}
