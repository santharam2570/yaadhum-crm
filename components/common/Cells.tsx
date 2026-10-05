import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar } from "./Avatar";

export function PersonCell({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink-900">{name}</p>
        {sub && <p className="truncate text-xs text-stone-500">{sub}</p>}
      </div>
    </div>
  );
}

export function TitleCell({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-ink-900">{title}</p>
      {sub && <p className="truncate text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export function Money({ value, strong }: { value: number; strong?: boolean }) {
  return <span className={strong ? "font-semibold text-ink-900" : undefined}>{formatCurrency(value)}</span>;
}

export function DateText({ value }: { value?: string }) {
  return <span className="text-stone-600">{formatDate(value)}</span>;
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-cream-100">
        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-stone-500">{pct}%</span>
    </div>
  );
}

export function ActionChip({
  label,
  onClick,
  tone = "brand",
}: {
  label: string;
  onClick: () => void;
  tone?: "brand" | "green" | "gray";
}) {
  const tones = {
    brand: "text-brand-700 bg-brand-50 hover:bg-brand-100",
    green: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
    gray: "text-stone-600 bg-stone-100 hover:bg-stone-200",
  };
  return (
    <button onClick={onClick} className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${tones[tone]}`}>
      {label}
    </button>
  );
}
