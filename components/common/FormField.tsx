import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-stone-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-stone-50";

export function Field({
  label,
  error,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-600">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-brand-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-stone-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(inputClass, invalid && "border-brand-500 ring-2 ring-brand-500/15", className)} {...props} />;
}

export function Select({
  className,
  invalid,
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; options: string[]; placeholder?: string }) {
  return (
    <select className={cn(inputClass, "pr-8", invalid && "border-brand-500 ring-2 ring-brand-500/15", className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      rows={3}
      className={cn(inputClass, "resize-y", invalid && "border-brand-500 ring-2 ring-brand-500/15", className)}
      {...props}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-brand-100 px-4 py-3 text-left transition hover:bg-cream-50"
    >
      <span>
        <span className="block text-sm font-semibold text-ink-900">{label}</span>
        {description && <span className="block text-xs text-stone-500">{description}</span>}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-brand-gradient" : "bg-stone-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
