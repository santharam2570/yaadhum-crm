export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "time"
  | "select"
  | "textarea"
  | "file";

export interface FieldRule {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
}

export type Errors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s-]{10,15}$/;

export function validate(fields: FieldRule[], values: Record<string, unknown>): Errors {
  const errors: Errors = {};
  for (const f of fields) {
    const raw = values[f.name];
    const value = typeof raw === "string" ? raw.trim() : raw;
    const empty = value === undefined || value === null || value === "";

    if (f.required && empty) {
      errors[f.name] = `${f.label} is required`;
      continue;
    }
    if (empty) continue;

    if (f.type === "email" && !EMAIL_RE.test(String(value))) {
      errors[f.name] = "Enter a valid email address";
    } else if (f.type === "tel" && !PHONE_RE.test(String(value))) {
      errors[f.name] = "Enter a valid phone number";
    } else if (f.type === "number") {
      const n = Number(value);
      if (Number.isNaN(n)) errors[f.name] = `${f.label} must be a number`;
      else if (f.min !== undefined && n < f.min) errors[f.name] = `${f.label} must be at least ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `${f.label} must be at most ${f.max}`;
    }
  }
  return errors;
}

export function hasErrors(errors: Errors) {
  return Object.keys(errors).length > 0;
}
