"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn, toneFor } from "@/lib/utils";
import { StatusBadge, tones } from "./Badge";

/** A status badge that doubles as a dropdown for changing the status in place. */
export function StatusSelect({
  value,
  options,
  onChange,
  disabled,
  size = "sm",
}: {
  value: string;
  options: string[];
  onChange: (next: string) => Promise<unknown>;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [busy, setBusy] = useState(false);
  if (disabled) return <StatusBadge status={value} />;
  const list = options.includes(value) ? options : [value, ...options];
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative inline-flex items-center rounded-full ring-1 ring-inset transition hover:brightness-95",
        tones[toneFor(value)],
        busy && "opacity-60",
      )}
    >
      <span className="pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <select
        value={value}
        disabled={busy}
        aria-label="Change status"
        onChange={async (e) => {
          setBusy(true);
          try {
            await onChange(e.target.value);
          } finally {
            setBusy(false);
          }
        }}
        className={cn(
          "cursor-pointer appearance-none rounded-full bg-transparent font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30",
          size === "sm" ? "py-0.5 pl-5 pr-6 text-[11px]" : "py-1 pl-6 pr-7 text-xs",
        )}
      >
        {list.map((o) => (
          <option key={o} value={o} className="bg-white text-ink-900">
            {o}
          </option>
        ))}
      </select>
      {busy ? (
        <Loader2 className="pointer-events-none absolute right-1.5 h-3 w-3 animate-spin" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3" />
      )}
    </span>
  );
}
