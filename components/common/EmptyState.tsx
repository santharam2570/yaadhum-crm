import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  message,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-glow text-brand-600 ring-1 ring-cream-300">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-display text-base font-bold text-ink-900">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-stone-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14 text-sm text-stone-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label}
    </div>
  );
}
