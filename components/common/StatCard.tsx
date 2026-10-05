import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: number;
  accent?: "brand" | "ember" | "dark" | "cream";
}

const accents = {
  brand: "bg-brand-gradient text-white",
  ember: "bg-gradient-to-br from-ember-400 to-ember-600 text-white",
  dark: "bg-gradient-to-br from-ink-700 to-ink-950 text-white",
  cream: "bg-glow text-brand-800 ring-1 ring-cream-300",
};

export function StatCard({ label, value, icon: Icon, hint, trend, accent = "brand" }: StatItem) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-brand-100/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-900/5 sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-50 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-stone-500 sm:text-xs">{label}</p>
          <p className="mt-2 truncate font-display text-xl font-bold text-ink-900 sm:text-2xl">{value}</p>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-11 sm:w-11",
              accents[accent],
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        )}
      </div>
      {(hint || trend !== undefined) && (
        <div className="relative mt-3 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
                trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700",
              )}
            >
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="text-stone-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
