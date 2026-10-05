"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { hasErrors, validate, type Errors, type FieldRule } from "@/lib/validations";
import { Button } from "./Button";
import { Field, Input, Select, Textarea } from "./FormField";
import { Modal } from "./Modal";

export interface FormFieldConfig extends FieldRule {
  options?: string[];
  optionsLoader?: () => Promise<string[]>;
  placeholder?: string;
  hint?: string;
  colSpan?: 1 | 2;
  step?: number;
  /** Hide from the form when it returns false (e.g. depends on another value). */
  visible?: (values: Record<string, unknown>) => boolean;
}

export type FormValues = Record<string, unknown>;

export function ResourceForm({
  open,
  title,
  description,
  fields,
  initial,
  submitLabel = "Save",
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  initial: FormValues;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) return;
    setValues(initial);
    setErrors({});
    fields
      .filter((f) => f.optionsLoader)
      .forEach((f) => f.optionsLoader!().then((opts) => setLoaded((prev) => ({ ...prev, [f.name]: opts }))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (name: string, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const visibleFields = fields.filter((f) => !f.visible || f.visible(values));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(visibleFields, values);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      const out: FormValues = { ...values };
      for (const f of visibleFields) {
        if (f.type === "number" && out[f.name] !== "" && out[f.name] !== undefined) out[f.name] = Number(out[f.name]);
      }
      await onSubmit(out);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="resource-form" loading={busy}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="resource-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleFields.map((f) => {
          const value = values[f.name];
          const err = errors[f.name];
          const options = f.options ?? loaded[f.name] ?? [];
          const str = value === undefined || value === null ? "" : String(value);
          return (
            <Field
              key={f.name}
              label={f.label}
              required={f.required}
              error={err}
              hint={f.hint}
              className={cn((f.colSpan === 2 || f.type === "textarea") && "sm:col-span-2")}
            >
              {f.type === "select" ? (
                <Select
                  value={str}
                  invalid={!!err}
                  options={options.includes(str) || !str ? options : [str, ...options]}
                  placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}`}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "textarea" ? (
                <Textarea
                  value={str}
                  invalid={!!err}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <Input
                  type={f.type ?? "text"}
                  value={str}
                  invalid={!!err}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </Field>
          );
        })}
      </form>
    </Modal>
  );
}
