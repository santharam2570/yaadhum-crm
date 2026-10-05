"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Mail, MessageCircle, Pencil, Phone, SearchX, Trash2, type LucideIcon } from "lucide-react";
import type { Entity } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useResource } from "@/hooks/useResource";
import { Avatar } from "./Avatar";
import { StatusBadge } from "./Badge";
import { Button } from "./Button";
import { Card, CardHeader } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, Spinner } from "./EmptyState";
import { ResourceForm, type FormFieldConfig, type FormValues } from "./ResourceForm";
import { changeStatus, statusFieldOf, type ResourceConfig } from "./ResourcePage";
import { StatGrid, type StatItem } from "./StatCard";
import { StatusSelect } from "./StatusSelect";
import { useToast } from "./Toast";

type DisplayType = "text" | "date" | "datetime" | "money" | "number" | "percent" | "email" | "tel" | "status" | "boolean" | "multiline";

export interface DetailItem<T> {
  key: string;
  label?: string;
  type?: DisplayType;
  render?: (row: T) => ReactNode;
  span?: 2;
}

export interface DetailSection<T> {
  title: string;
  description?: string;
  items: (string | DetailItem<T>)[];
}

export interface DetailContext<T> {
  update: (patch: Partial<T>) => Promise<T>;
  edit: () => void;
  canEdit: boolean;
  toast: (message: string, kind?: "success" | "error" | "info") => void;
}

export interface DetailPageProps<T extends Entity> extends ResourceConfig<T> {
  id: string;
  listLabel: string;
  basePath: string;
  /** Parent crumbs shown before the list crumb, e.g. HR. */
  parents?: { label: string; href: string }[];
  title: (row: T) => string;
  subtitle?: (row: T) => ReactNode;
  status?: (row: T) => string | undefined;
  avatar?: "person" | LucideIcon;
  contact?: (row: T) => { email?: string; phone?: string };
  sections?: DetailSection<T>[];
  stats?: (row: T) => StatItem[];
  actions?: (row: T, ctx: DetailContext<T>) => ReactNode;
  main?: (row: T, ctx: DetailContext<T>) => ReactNode;
  aside?: (row: T, ctx: DetailContext<T>) => ReactNode;
}

const ICON_LINK =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-ink-800 ring-1 ring-inset ring-brand-100 transition hover:bg-cream-100 hover:text-brand-700";

const STATUS_KEYS = new Set(["status", "stage", "priority", "type", "category", "mode"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

function humanize(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bId\b/, "ID")
    .replace(/\bKb\b/, "(KB)");
}

function inferType(key: string, value: unknown, field?: FormFieldConfig): DisplayType {
  if (field?.label.includes("₹")) return "money";
  if (field?.label.includes("(%)")) return "percent";
  if (field?.type === "email") return "email";
  if (field?.type === "tel") return "tel";
  if (field?.type === "textarea") return "multiline";
  if (field?.type === "date") return "date";
  if (typeof value === "boolean") return "boolean";
  if (STATUS_KEYS.has(key)) return "status";
  if (typeof value === "string" && ISO_DATETIME.test(value)) return "datetime";
  if (typeof value === "string" && ISO_DATE.test(value)) return "date";
  if (field?.type === "number" || typeof value === "number") return "number";
  return "text";
}

function renderValue(type: DisplayType, value: unknown): ReactNode {
  if (value === undefined || value === null || value === "") return <span className="text-stone-400">—</span>;
  switch (type) {
    case "money":
      return formatCurrency(Number(value));
    case "percent":
      return `${value}%`;
    case "number":
      return Number(value).toLocaleString("en-IN");
    case "date":
      return formatDate(String(value), { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    case "datetime":
      return formatDateTime(String(value));
    case "email":
      return (
        <a href={`mailto:${value}`} className="text-brand-700 hover:underline">
          {String(value)}
        </a>
      );
    case "tel":
      return (
        <a href={`tel:${String(value).replace(/\s/g, "")}`} className="text-brand-700 hover:underline">
          {String(value)}
        </a>
      );
    case "status":
      return <StatusBadge status={String(value)} />;
    case "boolean":
      return value ? "Yes" : "No";
    case "multiline":
      return <span className="whitespace-pre-wrap">{String(value)}</span>;
    default:
      return String(value);
  }
}

export function DetailPage<T extends Entity>(props: DetailPageProps<T>) {
  const { id, service, module, entityName, fields, basePath, listLabel } = props;
  const { data, loading, update, remove } = useResource(service);
  const { can } = usePermission();
  const toast = useToast();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const row = data.find((r) => r.id === id);
  const canEdit = can(module, "edit");
  const canDelete = can(module, "delete");

  if (loading) return <Spinner label={`Loading ${entityName.toLowerCase()}…`} />;
  if (!row)
    return (
      <EmptyState
        icon={SearchX}
        title={`${entityName} not found`}
        message="It may have been deleted or the link is incorrect."
        action={
          <Link href={basePath}>
            <Button>Back to {listLabel}</Button>
          </Link>
        }
      />
    );

  const record = row as unknown as Record<string, unknown>;
  const fieldByName = new Map(fields.map((f) => [f.name, f]));

  const ctx: DetailContext<T> = {
    update: (patch) => update(row.id, patch),
    edit: () => setEditOpen(true),
    canEdit,
    toast,
  };

  const resolve = (item: string | DetailItem<T>) => {
    const spec: DetailItem<T> = typeof item === "string" ? { key: item } : item;
    const field = fieldByName.get(spec.key);
    const label = spec.label ?? field?.label.replace(/\s*\((₹|%)\)/, "") ?? humanize(spec.key);
    const type = spec.type ?? inferType(spec.key, record[spec.key], field);
    const value = spec.render ? spec.render(row) : renderValue(type, record[spec.key]);
    return { key: spec.key, label, value, span: spec.span ?? (type === "multiline" ? 2 : undefined) };
  };

  // Every stored field is shown: configured sections first, then anything left over.
  const sections: DetailSection<T>[] = props.sections ?? [{ title: `${entityName} details`, items: fields.map((f) => f.name) }];
  const covered = new Set(sections.flatMap((s) => s.items.map((i) => (typeof i === "string" ? i : i.key))));
  const leftover = Object.keys(record).filter((k) => k !== "id" && !covered.has(k));
  const allSections = leftover.length ? [...sections, { title: "Additional information", items: leftover }] : sections;

  const title = props.title(row);
  const status = props.status?.(row);
  const statusField = statusFieldOf(props);
  const contact = props.contact?.(row);
  const AvatarIcon = props.avatar && props.avatar !== "person" ? props.avatar : null;

  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <Link href={basePath} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-ink-700 ring-1 ring-brand-100 transition hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        {props.parents?.map((p) => (
          <span key={p.href} className="flex items-center gap-2">
            <Link href={p.href} className="hover:text-brand-600">
              {p.label}
            </Link>
            <span>/</span>
          </span>
        ))}
        <Link href={basePath} className="hover:text-brand-600">
          {listLabel}
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink-800">{title}</span>
      </nav>

      <Card className="mb-6 overflow-hidden">
        <div className="bg-sidebar relative h-24 sm:h-28">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand-600/30 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 sm:pt-3">
            {props.avatar === "person" ? (
              <Avatar name={title} size="lg" className="-mt-10 h-20 w-20 text-xl ring-4" />
            ) : AvatarIcon ? (
              <span className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg ring-4 ring-white">
                <AvatarIcon className="h-9 w-9" />
              </span>
            ) : null}
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
                {statusField && canEdit ? (
                  <>
                    <StatusSelect
                      size="md"
                      value={String(record[statusField.key] ?? "")}
                      options={statusField.options}
                      onChange={async (next) => {
                        await changeStatus(props, row, statusField.key, next);
                        toast(`${entityName} marked ${next}`);
                      }}
                    />
                    {status && status !== record[statusField.key] && <StatusBadge status={status} />}
                  </>
                ) : (
                  status && <StatusBadge status={status} />
                )}
              </div>
              {props.subtitle && <div className="mt-0.5 text-sm text-stone-500">{props.subtitle(row)}</div>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contact?.phone && (
              <>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} title="Call" aria-label="Call" className={ICON_LINK}>
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  aria-label="WhatsApp"
                  className={ICON_LINK}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </>
            )}
            {contact?.email && (
              <a href={`mailto:${contact.email}`} title="Email" aria-label="Email" className={ICON_LINK}>
                <Mail className="h-4 w-4" />
              </a>
            )}
            {props.actions?.(row, ctx)}
            {canEdit && (
              <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="secondary" size="icon" aria-label="Delete" onClick={() => setDeleting(true)}>
                <Trash2 className="h-4 w-4 text-brand-700" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {props.stats && <StatGrid items={props.stats(row)} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {allSections.map((section) => (
            <Card key={section.title}>
              <CardHeader title={section.title} description={section.description} />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
                {section.items.map((item) => {
                  const f = resolve(item);
                  return (
                    <div key={f.key} className={cn("min-w-0", f.span === 2 && "sm:col-span-2")}>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{f.label}</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-ink-900">{f.value}</dd>
                    </div>
                  );
                })}
              </dl>
            </Card>
          ))}
          {props.main?.(row, ctx)}
        </div>

        <div className="space-y-6">
          {props.aside?.(row, ctx)}
          <Card>
            <CardHeader title="Record" />
            <div className="space-y-2 p-5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Record ID</span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(row.id);
                    toast("Record ID copied", "info");
                  }}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ink-800 hover:text-brand-700"
                >
                  {row.id} <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Module</span>
                <span className="font-semibold text-ink-800">{listLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Fields</span>
                <span className="font-semibold text-ink-800">{Object.keys(record).length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ResourceForm
        open={editOpen}
        title={`Edit ${entityName}`}
        description={title}
        fields={fields}
        initial={props.toForm?.(row) ?? (record as FormValues)}
        submitLabel="Save changes"
        onClose={() => setEditOpen(false)}
        onSubmit={async (values) => {
          const payload = props.beforeSave ? { ...values, ...props.beforeSave(values, row) } : values;
          await update(row.id, payload as Partial<T>);
          toast(`${entityName} updated`);
        }}
      />

      <ConfirmDialog
        open={deleting}
        title={`Delete ${entityName.toLowerCase()}?`}
        message={`"${title}" will be permanently removed.`}
        onClose={() => setDeleting(false)}
        onConfirm={async () => {
          await remove(row.id);
          toast(`${entityName} deleted`, "info");
          router.push(basePath);
        }}
      />
    </div>
  );
}
