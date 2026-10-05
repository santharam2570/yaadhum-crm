import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-family": ["font-display"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | undefined | null) {
  return inr.format(Number(value ?? 0));
}

export function formatCompact(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value}`;
}

export function formatDate(value?: string | Date | null, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date offset by `days` from today — used to keep demo data fresh. */
export function daysFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(from: string, to: string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

export function sum<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((acc, r) => acc + (Number(pick(r)) || 0), 0);
}

export function groupCount<T>(rows: T[], pick: (row: T) => string) {
  return rows.reduce<Record<string, number>>((acc, r) => {
    const k = pick(r) || "Other";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

export function monthKey(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function lastMonths(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(m.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }));
  }
  return out;
}

export function pick<T>(list: readonly T[], i: number): T {
  return list[i % list.length];
}

/** Tone used by <Badge /> for common status words across modules. */
export type Tone = "red" | "green" | "amber" | "blue" | "gray" | "purple" | "orange";

const STATUS_TONES: Record<string, Tone> = {
  new: "blue",
  contacted: "amber",
  qualified: "purple",
  converted: "green",
  lost: "gray",
  active: "green",
  inactive: "gray",
  completed: "green",
  graduated: "purple",
  dropped: "gray",
  "on hold": "amber",
  pending: "amber",
  approved: "green",
  rejected: "red",
  enrolled: "green",
  "under review": "blue",
  upcoming: "blue",
  ongoing: "green",
  paid: "green",
  partial: "amber",
  overdue: "red",
  unpaid: "red",
  processed: "blue",
  failed: "red",
  refunded: "gray",
  success: "green",
  scheduled: "blue",
  missed: "red",
  done: "green",
  todo: "gray",
  "in progress": "blue",
  high: "red",
  medium: "amber",
  low: "gray",
  urgent: "red",
  present: "green",
  absent: "red",
  late: "amber",
  "half day": "orange",
  leave: "purple",
  draft: "gray",
  published: "green",
  verified: "green",
  expired: "red",
  public: "red",
  optional: "amber",
  company: "blue",
  "welcome call": "blue",
  documents: "purple",
  "fee payment": "orange",
  "batch allocation": "amber",
  orientation: "red",
  read: "gray",
  unread: "red",
};

export function toneFor(status?: string): Tone {
  if (!status) return "gray";
  return STATUS_TONES[status.toLowerCase()] ?? "gray";
}
