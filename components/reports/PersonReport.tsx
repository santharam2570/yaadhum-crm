"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileBarChart, Printer, SearchX } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useSession } from "@/lib/auth";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState, Spinner } from "@/components/common/EmptyState";

/** Printable one-page report about a single person (student, employee, lead). */
export function ReportShell({
  kind,
  name,
  subtitle,
  status,
  backHref,
  loading,
  found,
  children,
}: {
  kind: string;
  name?: string;
  subtitle?: string;
  status?: string;
  backHref: string;
  loading: boolean;
  found: boolean;
  children?: ReactNode;
}) {
  const session = useSession();
  if (loading) return <Spinner label="Preparing report…" />;
  if (!found)
    return (
      <EmptyState
        icon={SearchX}
        title="Record not found"
        message="It may have been deleted or the link is incorrect."
        action={
          <Link href={backHref.split("/").slice(0, -1).join("/") || "/"}>
            <Button>Go back</Button>
          </Link>
        }
      />
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-brand-100 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
        </Link>
        <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="bg-sidebar flex items-center gap-4 px-6 py-5 text-white">
          <Image src="/logo-mark.jpg" alt="Yaadhum" width={52} height={52} className="logo-ring rounded-full" />
          <div className="flex-1">
            <p className="font-display text-lg font-bold tracking-[0.15em]">YAADHUM INTERNATIONAL</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand-300">Technologies · {kind} Report</p>
          </div>
          <div className="text-right text-[11px] text-stone-300">
            <p>Generated {formatDateTime(new Date().toISOString())}</p>
            {session && <p>by {session.name}</p>}
          </div>
        </header>

        <div className="flex items-center gap-4 border-b border-brand-100 px-6 py-5">
          <Avatar name={name ?? "?"} size="lg" className="h-14 w-14 text-base" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink-900">{name}</h1>
              {status && <StatusBadge status={status} />}
            </div>
            {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">{children}</div>

        <footer className="border-t border-dashed border-brand-200 bg-cream-50 px-6 py-3 text-center text-[11px] text-stone-500">
          Confidential · Yaadhum CRM · This report is generated from live CRM records.
        </footer>
      </article>
    </div>
  );
}

export function ReportButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <Button variant="secondary" icon={<FileBarChart className="h-4 w-4" />} onClick={() => router.push(href)}>
      Report
    </Button>
  );
}

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-3 border-l-4 border-brand-600 pl-2 font-display text-sm font-bold uppercase tracking-[0.15em] text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

export function ReportFields({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{i.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-ink-900">{i.value === undefined || i.value === null || i.value === "" ? "—" : i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReportTiles({ items }: { items: { label: string; value: ReactNode; tone?: "good" | "bad" }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-cream-50 px-4 py-3 ring-1 ring-brand-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{i.label}</p>
          <p className={`font-display text-xl font-bold ${i.tone === "good" ? "text-emerald-700" : i.tone === "bad" ? "text-brand-700" : "text-ink-900"}`}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ReportTable<T>({
  rows,
  columns,
  empty = "No records.",
}: {
  rows: T[];
  columns: { header: string; cell: (row: T) => ReactNode; align?: "right" }[];
  empty?: string;
}) {
  if (!rows.length) return <p className="rounded-lg bg-cream-50 px-4 py-3 text-sm text-stone-500">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-brand-100">
      <table className="w-full text-sm">
        <thead className="bg-cream-50 text-[10px] uppercase tracking-wider text-stone-500">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={`px-3 py-2 ${c.align === "right" ? "text-right" : "text-left"}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {rows.map((r, i) => (
            <tr key={i} className="break-inside-avoid">
              {columns.map((c) => (
                <td key={c.header} className={`px-3 py-2 ${c.align === "right" ? "text-right" : ""}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
