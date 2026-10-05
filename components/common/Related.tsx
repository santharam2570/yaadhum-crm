import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./Card";

export function RelatedCard({
  title,
  count,
  action,
  empty = "Nothing to show yet.",
  children,
  className,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  empty?: string;
  children?: ReactNode;
  className?: string;
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <Card className={className}>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">{count}</span>
            )}
          </span>
        }
        action={action}
      />
      {hasItems ? <ul className="divide-y divide-brand-50">{children}</ul> : <p className="px-5 py-8 text-center text-sm text-stone-500">{empty}</p>}
    </Card>
  );
}

export function RelatedRow({
  href,
  leading,
  title,
  sub,
  trailing,
}: {
  href?: string;
  leading?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
}) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
        {sub && <p className="truncate text-xs text-stone-500">{sub}</p>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
      {href && <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="flex items-center gap-3 px-5 py-3 transition hover:bg-brand-50/40">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3">{body}</div>
      )}
    </li>
  );
}

/** Horizontal progress through an ordered list of statuses. */
export function StatusStepper({ steps, current, failed }: { steps: string[]; current: string; failed?: boolean }) {
  const idx = steps.indexOf(current);
  return (
    <ol className="flex items-center">
      {steps.map((s, i) => {
        const done = idx >= 0 && i < idx;
        const active = i === idx;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 transition",
                  done && "bg-brand-gradient text-white ring-transparent",
                  active && !failed && "bg-white text-brand-700 ring-brand-500",
                  active && failed && "bg-stone-200 text-stone-600 ring-stone-300",
                  !done && !active && "bg-white text-stone-400 ring-brand-100",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap text-[11px] font-semibold", active ? "text-ink-900" : "text-stone-500")}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("mx-2 mb-5 h-0.5 flex-1 rounded", done ? "bg-brand-500" : "bg-brand-100")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function InfoList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-brand-50">
      {items.map((i) => (
        <div key={i.label} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
          <dt className="text-stone-500">{i.label}</dt>
          <dd className="text-right font-semibold text-ink-900">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
