"use client";

import Link from "next/link";
import { Check, Minus, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { activityService } from "@/services/followupService";
import { useResource } from "@/hooks/useResource";
import { ACTIONS, can, MODULES, ROLES, roleLabel } from "@/lib/permissions";
import { cn, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { userConfig, type UserRow } from "./UsersView";

function PermissionMatrix({ user }: { user: UserRow }) {
  const allowed = MODULES.filter((m) => can(user.role, m.key, "view"));
  return (
    <Card>
      <CardHeader
        title="Module access"
        description={`${allowed.length} of ${MODULES.length} modules visible to ${roleLabel(user.role)}`}
        action={
          <Link href="/roles" className="text-xs font-semibold text-brand-700">
            Edit roles
          </Link>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-2 text-left">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-3 py-2 text-center">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {MODULES.map((m) => (
              <tr key={m.key}>
                <td className="px-5 py-2 font-medium text-ink-800">{m.label}</td>
                {ACTIONS.map((a) => {
                  const ok = can(user.role, m.key, a);
                  return (
                    <td key={a} className="px-3 py-2 text-center">
                      <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md", ok ? "bg-emerald-50 text-emerald-600" : "text-stone-300")}>
                        {ok ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function UserActivity({ name }: { name: string }) {
  const items = useResource(activityService)
    .data.filter((a) => a.user === name)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);
  return (
    <RelatedCard title="Recent activity" count={items.length} empty="No activity recorded for this user.">
      {items.map((a) => (
        <RelatedRow key={a.id} href={`/activities/${a.id}`} title={a.title} sub={a.description} trailing={<span className="text-[11px] text-stone-400">{timeAgo(a.timestamp)}</span>} />
      ))}
    </RelatedCard>
  );
}

export function UserDetail({ id }: { id: string }) {
  return (
    <DetailPage<UserRow>
      {...userConfig}
      basePath="/users"
      id={id}
      listLabel="Users"
      avatar="person"
      title={(u) => u.name}
      subtitle={(u) => `${roleLabel(u.role)} · ${u.email}`}
      status={(u) => u.status}
      contact={(u) => ({ email: u.email, phone: u.phone })}
      sections={[
        { title: "Account", items: ["name", "email", "phone", "status", { key: "lastLogin", label: "Last login", type: "datetime" }] },
        {
          title: "Access",
          items: [
            { key: "role", label: "Role", render: (u) => <Badge tone={u.role === "admin" ? "red" : "orange"}>{roleLabel(u.role)}</Badge> },
            { key: "roleDescription", label: "Role description", render: (u) => ROLES.find((r) => r.key === u.role)?.description },
          ],
        },
      ]}
      actions={(u, ctx) =>
        ctx.canEdit ? (
          <Button
            variant="secondary"
            icon={u.status === "Active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            onClick={async () => {
              await ctx.update({ status: u.status === "Active" ? "Inactive" : "Active" });
              ctx.toast(u.status === "Active" ? "User deactivated" : "User activated");
            }}
          >
            {u.status === "Active" ? "Deactivate" : "Activate"}
          </Button>
        ) : null
      }
      main={(u) => <PermissionMatrix user={u} />}
      aside={(u) => (
        <>
          <Card>
            <CardHeader title="Role" />
            <div className="flex items-center gap-3 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink-900">{roleLabel(u.role)}</p>
                <p className="text-xs text-stone-500">{ROLES.find((r) => r.key === u.role)?.description}</p>
              </div>
            </div>
          </Card>
          <EmployeeLinkCard title="Employee profile" name={u.name} />
          <UserActivity name={u.name} />
        </>
      )}
    />
  );
}
