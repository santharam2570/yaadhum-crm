"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, Save, ShieldCheck } from "lucide-react";
import {
  ACTIONS,
  getMatrix,
  MODULES,
  resetMatrix,
  ROLES,
  saveMatrix,
  type Action,
  type ModuleKey,
  type RoleKey,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useResource } from "@/hooks/useResource";
import { userService } from "@/services/adminService";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/components/common/Toast";

type Matrix = ReturnType<typeof getMatrix>;

export function RolesView() {
  const { can } = usePermission();
  const { data: users } = useResource(userService);
  const toast = useToast();
  const [matrix, setMatrix] = useState<Matrix>(getMatrix);
  const [role, setRole] = useState<RoleKey>("manager");
  const [dirty, setDirty] = useState(false);
  const editable = can("roles", "edit") && role !== "admin";

  useEffect(() => setMatrix(getMatrix()), []);

  const has = (m: ModuleKey, a: Action) => role === "admin" || (matrix[role]?.[m]?.includes(a) ?? false);

  const toggle = (m: ModuleKey, a: Action) => {
    if (!editable) return;
    setMatrix((prev) => {
      const current = new Set(prev[role]?.[m] ?? []);
      if (current.has(a)) {
        current.delete(a);
        if (a === "view") current.clear();
      } else {
        current.add(a);
        current.add("view");
      }
      return { ...prev, [role]: { ...prev[role], [m]: ACTIONS.filter((x) => current.has(x)) } };
    });
    setDirty(true);
  };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Control what each role can see and do. Administrators always have full access."
        actions={
          can("roles", "edit") && (
            <>
              <Button
                variant="secondary"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  resetMatrix();
                  setMatrix(getMatrix());
                  setDirty(false);
                  toast("Permissions reset to defaults", "info");
                }}
              >
                Reset defaults
              </Button>
              <Button
                icon={<Save className="h-4 w-4" />}
                disabled={!dirty}
                onClick={() => {
                  saveMatrix(matrix);
                  setDirty(false);
                  toast("Permissions saved");
                }}
              >
                Save changes
              </Button>
            </>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r.key).length;
          return (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                role === r.key
                  ? "border-transparent bg-sidebar text-white shadow-lg shadow-brand-950/20"
                  : "border-brand-100/70 bg-white hover:border-brand-300",
              )}
            >
              <div className="flex items-center justify-between">
                <ShieldCheck className={cn("h-5 w-5", role === r.key ? "text-brand-400" : "text-brand-600")} />
                <span className={cn("text-xs font-semibold", role === r.key ? "text-stone-300" : "text-stone-500")}>
                  {count} user{count === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-3 font-display text-lg font-bold">{r.label}</p>
              <p className={cn("text-xs", role === r.key ? "text-stone-300" : "text-stone-500")}>{r.description}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title={`${ROLES.find((r) => r.key === role)?.label} permissions`}
          description={role === "admin" ? "Administrators have unrestricted access." : "Click a cell to toggle. Granting any action also grants view."}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50/70">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {MODULES.map((m) => (
                <tr key={m.key} className="hover:bg-brand-50/30">
                  <td className="px-5 py-2.5 font-semibold text-ink-800">{m.label}</td>
                  {ACTIONS.map((a) => {
                    const on = has(m.key, a);
                    return (
                      <td key={a} className="px-5 py-2.5 text-center">
                        <button
                          onClick={() => toggle(m.key, a)}
                          disabled={!editable}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 transition disabled:cursor-not-allowed",
                            on ? "bg-brand-gradient text-white ring-transparent" : "bg-white text-transparent ring-brand-100 hover:ring-brand-300",
                          )}
                          aria-label={`${on ? "Revoke" : "Grant"} ${a} on ${m.label}`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
