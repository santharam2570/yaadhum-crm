"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, LayoutGrid, List, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { CrudService, Entity } from "@/lib/api";
import type { ModuleKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useResource } from "@/hooks/useResource";
import { Button } from "./Button";
import { Card } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable, type Column } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { Select } from "./FormField";
import { PageHeader } from "./PageHeader";
import { ResourceForm, type FormFieldConfig, type FormValues } from "./ResourceForm";
import { StatGrid, type StatItem } from "./StatCard";
import { StatusSelect } from "./StatusSelect";
import { useToast } from "./Toast";

export interface RowContext<T> {
  update: (id: string, patch: Partial<T>) => Promise<T>;
  edit: (row: T) => void;
  /** Opens the record's detail page (falls back to the edit form). */
  open: (row: T) => void;
  canEdit: boolean;
  toast: (message: string, kind?: "success" | "error" | "info") => void;
}

/** Shared between a module's list page and its detail page. */
export interface ResourceConfig<T extends Entity> {
  entityName: string;
  module: ModuleKey;
  service: CrudService<T>;
  fields: FormFieldConfig[];
  /** List route, e.g. "/leads". Detail pages live at `${basePath}/${id}`. */
  basePath?: string;
  defaults?: () => Partial<T>;
  /** Maps a stored row to form values when editing (inverse of `beforeSave`). */
  toForm?: (row: T) => FormValues;
  beforeSave?: (values: FormValues, existing?: T) => Partial<T>;
  /** Field changed by the inline status dropdown. Defaults to a "status" or "stage" select field. */
  statusKey?: string;
  /** Runs instead of a plain update when the status is changed from a dropdown (for side effects). */
  onStatusChange?: (row: T, status: string) => Promise<unknown>;
}

/** The select field backing a module's status dropdown, if it has one. */
export function statusFieldOf<T extends Entity>(config: ResourceConfig<T>) {
  const keys = config.statusKey ? [config.statusKey] : ["status", "stage"];
  const field = config.fields.find((f) => keys.includes(f.name) && f.type === "select" && f.options?.length);
  return field ? { key: field.name, options: field.options as string[] } : null;
}

/** Applies a status change through the module's hook, or as a plain update. */
export async function changeStatus<T extends Entity>(config: ResourceConfig<T>, row: T, key: string, next: string) {
  if (config.onStatusChange) await config.onStatusChange(row, next);
  else await config.service.update(row.id, { [key]: next } as Partial<T>);
}

export interface ResourcePageProps<T extends Entity> extends ResourceConfig<T> {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  columns: Column<T>[];
  searchKeys: (keyof T & string)[];
  filters?: { key: keyof T & string; label: string; options: string[] }[];
  stats?: (rows: T[]) => StatItem[];
  afterCreate?: (row: T) => void;
  rowActions?: (row: T, ctx: RowContext<T>) => ReactNode;
  renderBoard?: (rows: T[], ctx: RowContext<T>) => ReactNode;
  headerActions?: ReactNode;
  pageSize?: number;
}

function toCsv<T extends Entity>(rows: T[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => k !== "id");
  const body = rows.map((r) => keys.map((k) => esc((r as Record<string, unknown>)[k])).join(","));
  return [keys.map(esc).join(","), ...body].join("\n");
}

export function ResourcePage<T extends Entity>(props: ResourcePageProps<T>) {
  const { title, description, breadcrumbs, entityName, module, service, columns, fields, searchKeys } = props;
  const { data, loading, create, update, remove } = useResource(service);
  const { can } = usePermission();
  const toast = useToast();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<T | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [view, setView] = useState<"table" | "board">(props.renderBoard ? "board" : "table");

  const canCreate = can(module, "create");
  const canEdit = can(module, "edit");
  const canDelete = can(module, "delete");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((row) => {
      const rec = row as Record<string, unknown>;
      if (q && !searchKeys.some((k) => String(rec[k] ?? "").toLowerCase().includes(q))) return false;
      return Object.entries(filterValues).every(([k, v]) => !v || String(rec[k]) === v);
    });
  }, [data, query, filterValues, searchKeys]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setFormOpen(true);
  };

  const openDetail = (row: T) => {
    if (props.basePath) router.push(`${props.basePath}/${row.id}`);
    else if (canEdit) openEdit(row);
  };

  const ctx: RowContext<T> = { update, edit: openEdit, open: openDetail, canEdit, toast };

  const statusField = statusFieldOf(props);
  const tableColumns: Column<T>[] =
    statusField && canEdit
      ? columns.map((c) =>
          c.key === statusField.key
            ? {
                ...c,
                render: (row: T) => (
                  <StatusSelect
                    value={String((row as Record<string, unknown>)[statusField.key] ?? "")}
                    options={statusField.options}
                    onChange={async (next) => {
                      await changeStatus(props, row, statusField.key, next);
                      toast(`${entityName} marked ${next}`);
                    }}
                  />
                ),
              }
            : c,
        )
      : columns;

  const initial: FormValues = editing
    ? (props.toForm?.(editing) ?? (editing as unknown as FormValues))
    : ((props.defaults?.() ?? {}) as FormValues);

  const handleSubmit = async (values: FormValues) => {
    const payload = props.beforeSave ? { ...values, ...props.beforeSave(values, editing ?? undefined) } : values;
    try {
      if (editing) {
        await update(editing.id, payload as Partial<T>);
        toast(`${entityName} updated`);
      } else {
        const { id: _id, ...rest } = payload as FormValues;
        const row = await create(rest as Omit<T, "id">);
        props.afterCreate?.(row);
        toast(`${entityName} created`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong", "error");
      throw e;
    }
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = Object.values(filterValues).filter(Boolean).length + (query ? 1 : 0);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            {props.headerActions}
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
              Export
            </Button>
            {canCreate && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add {entityName}
              </Button>
            )}
          </>
        }
      />

      {props.stats && !loading && <StatGrid items={props.stats(data)} />}

      <Card>
        <div className="flex flex-col gap-3 border-b border-brand-50 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="w-full rounded-lg border border-brand-100 bg-cream-50/50 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {props.filters?.map((f) => (
              <Select
                key={f.key}
                className="w-auto min-w-36"
                value={filterValues[f.key] ?? ""}
                onChange={(e) => setFilterValues((s) => ({ ...s, [f.key]: e.target.value }))}
                options={f.options}
                placeholder={`All ${f.label}`}
              />
            ))}
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  setQuery("");
                  setFilterValues({});
                }}
              >
                Clear
              </Button>
            )}
            {props.renderBoard && (
              <div className="flex rounded-lg bg-cream-100 p-0.5">
                {(["board", "table"] as const).map((v) => {
                  const Icon = v === "board" ? LayoutGrid : List;
                  return (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-stone-500 transition",
                        view === v && "bg-white text-brand-700 shadow-sm",
                      )}
                      aria-label={`${v} view`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {view === "board" && props.renderBoard ? (
          <div className="p-4">{props.renderBoard(filtered, ctx)}</div>
        ) : (
          <DataTable
            rows={filtered}
            columns={tableColumns}
            loading={loading}
            pageSize={props.pageSize}
            onRowClick={props.basePath ? openDetail : undefined}
            empty={
              <EmptyState
                title={data.length ? "No matches" : `No ${title.toLowerCase()} yet`}
                message={data.length ? "Try a different search or clear the filters." : `Add your first ${entityName.toLowerCase()} to get started.`}
                action={
                  !data.length && canCreate ? (
                    <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                      Add {entityName}
                    </Button>
                  ) : undefined
                }
              />
            }
            actions={
              canEdit || canDelete || props.rowActions || props.basePath
                ? (row) => (
                    <>
                      {props.rowActions?.(row, ctx)}
                      {props.basePath && (
                        <button
                          onClick={() => openDetail(row)}
                          className="rounded-md p-1.5 text-stone-500 transition hover:bg-brand-50 hover:text-brand-700"
                          aria-label="View details"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-md p-1.5 text-stone-500 transition hover:bg-brand-50 hover:text-brand-700"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleting(row)}
                          className="rounded-md p-1.5 text-stone-500 transition hover:bg-brand-50 hover:text-brand-700"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )
                : undefined
            }
          />
        )}
      </Card>

      <ResourceForm
        open={formOpen}
        title={editing ? `Edit ${entityName}` : `New ${entityName}`}
        description={editing ? "Update the details below." : `Fill in the details to add a new ${entityName.toLowerCase()}.`}
        fields={fields}
        initial={initial}
        submitLabel={editing ? "Save changes" : `Create ${entityName}`}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${entityName.toLowerCase()}?`}
        message="This action cannot be undone. The record will be permanently removed."
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await remove(deleting.id);
          toast(`${entityName} deleted`, "info");
        }}
      />
    </div>
  );
}
