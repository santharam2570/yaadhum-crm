"use client";

import { ShieldCheck, UserCheck, UserCog, UserX } from "lucide-react";
import type { AppUser } from "@/types/common";
import { userService } from "@/services/adminService";
import { ROLES, roleLabel, type RoleKey } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { PersonCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";

const ROLE_LABELS = ROLES.map((r) => r.label);
const labelToKey = (label: string) => ROLES.find((r) => r.label === label)?.key ?? (label as RoleKey);

export type UserRow = AppUser & { roleLabel?: string };

export const userConfig: ResourceConfig<UserRow> = {
  entityName: "User",
  module: "users",
  service: userService,
  basePath: "/users",
  fields: [
    { name: "name", label: "Full name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "roleLabel", label: "Role", type: "select", required: true, options: ROLE_LABELS },
    { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"] },
  ],
  defaults: () => ({ roleLabel: "Counsellor", status: "Active" }),
  toForm: (r) => ({ ...r, roleLabel: roleLabel(r.role) }),
  beforeSave: (v) => ({ role: labelToKey(String(v.roleLabel)), roleLabel: undefined }),
};

export function UsersView() {
  return (
    <ResourcePage<UserRow>
      {...userConfig}
      title="Users"
      description="People who can sign in to Yaadhum CRM and their access level."
      searchKeys={["name", "email", "phone"]}
      filters={[
        { key: "role", label: "Roles", options: ROLES.map((r) => r.key) },
        { key: "status", label: "Statuses", options: ["Active", "Inactive"] },
      ]}
      stats={(rows) => [
        { label: "Users", value: rows.length, icon: UserCog },
        { label: "Active", value: rows.filter((r) => r.status === "Active").length, icon: UserCheck, accent: "ember" },
        { label: "Admins", value: rows.filter((r) => r.role === "admin").length, icon: ShieldCheck, accent: "cream" },
        { label: "Inactive", value: rows.filter((r) => r.status === "Inactive").length, icon: UserX, accent: "dark" },
      ]}
      columns={[
        { key: "name", header: "User", render: (r) => <PersonCell name={r.name} sub={r.email} /> },
        { key: "phone", header: "Phone", hideBelow: "md" },
        { key: "role", header: "Role", render: (r) => <Badge tone={r.role === "admin" ? "red" : "orange"}>{roleLabel(r.role)}</Badge> },
        { key: "lastLogin", header: "Last login", render: (r) => <span className="text-stone-600">{formatDateTime(r.lastLogin)}</span>, hideBelow: "sm" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
