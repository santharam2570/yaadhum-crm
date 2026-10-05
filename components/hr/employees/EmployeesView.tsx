"use client";

import { Building2, IndianRupee, UserCheck, Users } from "lucide-react";
import type { Employee } from "@/types/employee";
import { DEPARTMENTS, employeeService, getDepartmentOptions } from "@/services/employeeService";
import { formatCompact, sum, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { DateText, Money, PersonCell, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const STATUSES = ["Active", "On Leave", "Inactive"];
export const HR_CRUMBS = [{ label: "HR", href: "/hr" }];

export const employeeConfig: ResourceConfig<Employee> = {
  entityName: "Employee",
  module: "hr",
  service: employeeService,
  basePath: "/hr/employees",
  fields: [
    { name: "name", label: "Full name", required: true },
    { name: "employeeId", label: "Employee ID", required: true, placeholder: "YIT-1xxx" },
    { name: "email", label: "Work email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "department", label: "Department", type: "select", required: true, optionsLoader: getDepartmentOptions },
    { name: "designation", label: "Designation", required: true },
    { name: "joiningDate", label: "Joining date", type: "date", required: true },
    { name: "salary", label: "Monthly salary (₹)", type: "number", required: true, min: 0 },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
  ],
  defaults: () => ({
    status: "Active",
    joiningDate: todayISO(),
    employeeId: `YIT-${Math.floor(1100 + Math.random() * 800)}`,
  }),
};

export function EmployeesView() {
  return (
    <ResourcePage<Employee>
      {...employeeConfig}
      title="Employees"
      description="Your team directory — roles, departments and compensation."
      breadcrumbs={[...HR_CRUMBS, { label: "Employees" }]}
      searchKeys={["name", "employeeId", "email", "designation", "department"]}
      filters={[
        { key: "department", label: "Departments", options: DEPARTMENTS },
        { key: "status", label: "Statuses", options: STATUSES },
      ]}
      stats={(rows) => [
        { label: "Headcount", value: rows.length, icon: Users },
        { label: "Active", value: rows.filter((r) => r.status === "Active").length, icon: UserCheck, accent: "ember" },
        { label: "Departments", value: new Set(rows.map((r) => r.department)).size, icon: Building2, accent: "cream" },
        { label: "Monthly CTC", value: formatCompact(sum(rows, (r) => r.salary)), icon: IndianRupee, accent: "dark" },
      ]}
      columns={[
        { key: "name", header: "Employee", render: (r) => <PersonCell name={r.name} sub={`${r.employeeId} · ${r.email}`} /> },
        { key: "designation", header: "Role", render: (r) => <TitleCell title={r.designation} sub={r.department} /> },
        { key: "phone", header: "Phone", hideBelow: "lg" },
        { key: "joiningDate", header: "Joined", render: (r) => <DateText value={r.joiningDate} />, hideBelow: "md" },
        { key: "salary", header: "Salary", render: (r) => <Money value={r.salary} />, hideBelow: "sm" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
