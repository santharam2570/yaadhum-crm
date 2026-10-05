import { cn, initials } from "@/lib/utils";

const palettes = [
  "from-brand-500 to-brand-800",
  "from-ember-400 to-brand-600",
  "from-brand-700 to-ink-900",
  "from-ember-500 to-brand-900",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white",
        palettes[idx],
        size === "sm" && "h-7 w-7 text-[10px]",
        size === "md" && "h-9 w-9 text-xs",
        size === "lg" && "h-12 w-12 text-sm",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
