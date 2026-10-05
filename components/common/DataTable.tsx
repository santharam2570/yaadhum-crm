"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Spinner } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
  /** Hide on small screens to keep tables readable on mobile. */
  hideBelow?: "sm" | "md" | "lg";
}

const hideClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

function readValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading,
  actions,
  pageSize = 10,
  empty,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  actions?: (row: T) => ReactNode;
  pageSize?: number;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const get = (r: T) => (col?.sortValue ? col.sortValue(r) : (readValue(r, sort.key) as string | number));
    return [...rows].sort((a, b) => {
      const va = get(a) ?? "";
      const vb = get(b) ?? "";
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  if (loading) return <Spinner />;
  if (!rows.length) return <>{empty ?? <EmptyState message="Try adjusting your search or filters." />}</>;

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-50 bg-cream-50/70">
              {columns.map((c) => {
                const sortable = c.sortable !== false;
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-stone-500",
                      c.hideBelow && hideClass[c.hideBelow],
                      c.className,
                    )}
                  >
                    {sortable ? (
                      <button
                        onClick={() => toggleSort(c.key)}
                        className={cn("inline-flex items-center gap-1 hover:text-brand-700", active && "text-brand-700")}
                      >
                        {c.header}
                        {active ? (
                          sort?.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {actions && <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-stone-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50/80">
            {visible.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("transition hover:bg-brand-50/40", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("whitespace-nowrap px-4 py-3 text-ink-800", c.hideBelow && hideClass[c.hideBelow], c.className)}
                  >
                    {c.render ? c.render(row) : String(readValue(row, c.key) ?? "—")}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 border-t border-brand-50 px-4 py-3 text-xs text-stone-500 sm:flex-row">
        <span>
          Showing <b className="text-ink-800">{(current - 1) * pageSize + 1}</b>–
          <b className="text-ink-800">{Math.min(current * pageSize, sorted.length)}</b> of{" "}
          <b className="text-ink-800">{sorted.length}</b>
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
            className="rounded-md p-1.5 hover:bg-brand-50 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - current) <= 1)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                <button
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-7 min-w-7 rounded-md px-2 font-semibold",
                    p === current ? "bg-brand-gradient text-white" : "hover:bg-brand-50",
                  )}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
            className="rounded-md p-1.5 hover:bg-brand-50 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
