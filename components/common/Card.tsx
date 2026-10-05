import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-brand-100/70 bg-white shadow-sm shadow-brand-950/[0.03]", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-brand-50 px-5 py-4", className)}>
      <div>
        <h3 className="font-display text-base font-bold tracking-wide text-ink-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-ink-600/70">{description}</p>}
      </div>
      {action}
    </div>
  );
}
