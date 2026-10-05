"use client";

import { useMemo } from "react";
import { Building2, MapPin, UserRound } from "lucide-react";
import type { Department } from "@/types/employee";
import { departmentService, getEmployeeOptions } from "@/services/employeeService";
import { useEmployees } from "@/hooks/useEmployees";
import { formatCompact, sum } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig, type RowContext } from "@/components/common/ResourcePage";

export const departmentConfig: ResourceConfig<Department> = {
  entityName: "Department",
  module: "hr",
  service: departmentService,
  basePath: "/hr/departments",
  fields: [
    { name: "name", label: "Department name", required: true },
    { name: "head", label: "Department head", type: "select", required: true, optionsLoader: getEmployeeOptions },
    { name: "location", label: "Location", type: "select", options: ["Chennai HQ", "Coimbatore Branch", "Madurai Branch", "Remote"] },
    { name: "description", label: "Description", type: "textarea" },
  ],
};

function DepartmentCards({ rows, ctx }: { rows: Department[]; ctx: RowContext<Department> }) {
  const { data: employees } = useEmployees();
  const byDept = useMemo(() => {
    const map = new Map<string, typeof employees>();
    employees.forEach((e) => map.set(e.department, [...(map.get(e.department) ?? []), e]));
    return map;
  }, [employees]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((d) => {
        const team = byDept.get(d.name) ?? [];
        return (
          <button
            key={d.id}
            onClick={() => ctx.open(d)}
            className="rounded-2xl border border-brand-100/70 bg-white p-5 text-left transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="text-right">
                <span className="block font-display text-2xl font-bold text-ink-900">{team.length}</span>
                <span className="text-[11px] uppercase tracking-wider text-stone-500">members</span>
              </span>
            </div>
            <p className="mt-4 font-display text-lg font-bold text-ink-900">{d.name}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" /> {d.head}
              </span>
              {d.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {d.location}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-brand-50 pt-3">
              <div className="flex -space-x-2">
                {team.slice(0, 5).map((e) => (
                  <Avatar key={e.id} name={e.name} size="sm" />
                ))}
                {team.length > 5 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-100 text-[10px] font-bold text-brand-800 ring-2 ring-white">
                    +{team.length - 5}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-ink-700">{formatCompact(sum(team, (e) => e.salary))}/mo</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function DepartmentsView() {
  return (
    <ResourcePage<Department>
      {...departmentConfig}
      title="Departments"
      description="Organisation structure, heads and team sizes."
      breadcrumbs={[{ label: "HR", href: "/hr" }, { label: "Departments" }]}
      searchKeys={["name", "head", "location"]}
      renderBoard={(rows, ctx) => <DepartmentCards rows={rows} ctx={ctx} />}
      columns={[
        { key: "name", header: "Department", render: (r) => <TitleCell title={r.name} sub={r.description} /> },
        { key: "head", header: "Head" },
        { key: "location", header: "Location", hideBelow: "sm" },
      ]}
    />
  );
}
