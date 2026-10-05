"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RotateCcw, Save } from "lucide-react";
import type { OrgSettings } from "@/types/common";
import { settingsService } from "@/services/adminService";
import { resetLocalData, API_URL } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useResource } from "@/hooks/useResource";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Spinner } from "@/components/common/EmptyState";
import { Field, Input, Select, Textarea, Toggle } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/components/common/Toast";

const PALETTE = [
  { name: "Yaadhum Red", hex: "#e3101a", cls: "bg-brand-600" },
  { name: "Crimson", hex: "#bf0a12", cls: "bg-brand-700" },
  { name: "Maroon", hex: "#7a0a0e", cls: "bg-brand-900" },
  { name: "Ember", hex: "#f25c1f", cls: "bg-ember-500" },
  { name: "Cream Glow", hex: "#f9e4c0", cls: "bg-cream-200" },
  { name: "Ink Black", hex: "#0b0808", cls: "bg-ink-950" },
];

export function SettingsView() {
  const { data, loading, update } = useResource(settingsService);
  const { can } = usePermission();
  const toast = useToast();
  const [form, setForm] = useState<OrgSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const editable = can("settings", "edit");

  useEffect(() => {
    if (data[0] && !form) setForm(data[0]);
  }, [data, form]);

  if (loading || !form) return <Spinner />;

  const set = <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) => setForm({ ...form, [key]: value });

  const save = async () => {
    setBusy(true);
    await update(form.id, form);
    setBusy(false);
    toast("Settings saved");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Organisation profile, preferences and branding."
        actions={
          editable && (
            <Button icon={<Save className="h-4 w-4" />} loading={busy} onClick={save}>
              Save settings
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Organisation" description="Appears on receipts, reports and emails." />
            <fieldset disabled={!editable} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="Company name">
                <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
              </Field>
              <Field label="App name">
                <Input value={form.appName} onChange={(e) => set("appName", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="GSTIN">
                <Input value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />
              </Field>
              <Field label="Receipt prefix">
                <Input value={form.receiptPrefix} onChange={(e) => set("receiptPrefix", e.target.value)} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </fieldset>
          </Card>

          <Card>
            <CardHeader title="Preferences" />
            <fieldset disabled={!editable} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <Field label="Currency">
                <Select value={form.currency} options={["INR", "USD", "AED", "SGD"]} onChange={(e) => set("currency", e.target.value)} />
              </Field>
              <Field label="Timezone">
                <Select value={form.timezone} options={["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "UTC"]} onChange={(e) => set("timezone", e.target.value)} />
              </Field>
              <Field label="Academic year">
                <Select value={form.academicYear} options={["2025-26", "2026-27", "2027-28"]} onChange={(e) => set("academicYear", e.target.value)} />
              </Field>
            </fieldset>
          </Card>

          <Card>
            <CardHeader title="Notification channels" description="How leads, students and staff get reminders." />
            <div className="space-y-3 p-5">
              <Toggle label="Email notifications" description="Fee reminders, receipts and admission updates" checked={form.emailNotifications} onChange={(v) => editable && set("emailNotifications", v)} />
              <Toggle label="SMS notifications" description="Follow-up and class reminders via SMS" checked={form.smsNotifications} onChange={(v) => editable && set("smsNotifications", v)} />
              <Toggle label="WhatsApp notifications" description="Lead nurturing and payment links on WhatsApp" checked={form.whatsappNotifications} onChange={(v) => editable && set("whatsappNotifications", v)} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-sidebar flex flex-col items-center p-6">
              <Image src="/logo-full.jpg" alt="Yaadhum International Technologies" width={260} height={208} className="mix-blend-lighten" />
            </div>
            <div className="p-5">
              <p className="mb-3 font-display text-base font-bold">Brand palette</p>
              <div className="grid grid-cols-3 gap-3">
                {PALETTE.map((c) => (
                  <div key={c.hex}>
                    <div className={`h-12 rounded-xl ring-1 ring-black/5 ${c.cls}`} />
                    <p className="mt-1 text-[11px] font-semibold text-ink-800">{c.name}</p>
                    <p className="font-mono text-[10px] text-stone-500">{c.hex}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Data source" />
            <div className="space-y-2 p-5 text-sm">
              <p>
                Mode:{" "}
                <b className="text-brand-700">{API_URL ? "Remote API" : "Local demo store"}</b>
              </p>
              <p className="text-xs text-stone-500">
                {API_URL
                  ? `Connected to ${API_URL}`
                  : "Data is stored in this browser. Set NEXT_PUBLIC_API_URL in .env.local to connect a backend."}
              </p>
            </div>
          </Card>

          {editable && !API_URL && (
            <Card className="border-brand-200">
              <CardHeader title="Danger zone" />
              <div className="p-5">
                <p className="mb-3 text-sm text-stone-600">Reset all demo data back to the original sample records.</p>
                <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>
                  Reset demo data
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="Every lead, student, payment and HR record you've added will be replaced with the sample data."
        confirmLabel="Reset data"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetLocalData();
          setForm(null);
          toast("Demo data has been reset", "info");
        }}
      />
    </div>
  );
}
