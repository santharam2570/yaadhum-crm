"use client";

import { useState } from "react";
import { IndianRupee } from "lucide-react";
import type { FeeAccount, PaymentMode } from "@/types/payment";
import { feeService, feeStatus, paymentService, PAYMENT_MODES } from "@/services/paymentService";
import { logActivity } from "@/services/followupService";
import { formatCurrency, todayISO } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { ActionChip } from "@/components/common/Cells";
import { Field, Input, Select } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";

export function CollectFeeButton({ fee, variant = "chip" }: { fee: FeeAccount; variant?: "chip" | "button" }) {
  const balance = Math.max(0, fee.totalFee - fee.discount - fee.paid);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(balance));
  const [mode, setMode] = useState<PaymentMode>("UPI");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (balance <= 0) return null;

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return setError("Enter a valid amount");
    if (value > balance) return setError(`Amount cannot exceed balance of ${formatCurrency(balance)}`);
    setBusy(true);
    const payments = await paymentService.list();
    const lastNo = Math.max(1000, ...payments.map((p) => Number(p.receiptNo.replace(/\D/g, "")) || 0));
    const receiptNo = `RCPT-${lastNo + 1}`;
    await paymentService.create({
      receiptNo,
      studentName: fee.studentName,
      course: fee.course,
      amount: value,
      mode,
      date: todayISO(),
      status: "Success",
      reference,
    });
    const paid = fee.paid + value;
    await feeService.update(fee.id, { paid, status: feeStatus({ ...fee, paid }) });
    await logActivity("payment", "Payment received", `${formatCurrency(value)} received from ${fee.studentName} via ${mode}.`);
    setBusy(false);
    setOpen(false);
    toast(`${formatCurrency(value)} collected · ${receiptNo}`);
  };

  const openModal = () => {
    setAmount(String(balance));
    setError("");
    setOpen(true);
  };

  return (
    <>
      {variant === "button" ? (
        <Button variant="dark" icon={<IndianRupee className="h-4 w-4" />} onClick={openModal}>
          Collect fee
        </Button>
      ) : (
        <ActionChip label="Collect" tone="green" onClick={openModal} />
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Collect fee"
        description={`${fee.studentName} · ${fee.course}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={submit}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-glow p-4 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-brand-800">Net fee</p>
            <p className="font-display text-lg font-bold">{formatCurrency(fee.totalFee - fee.discount)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-brand-800">Paid</p>
            <p className="font-display text-lg font-bold text-emerald-700">{formatCurrency(fee.paid)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-brand-800">Balance</p>
            <p className="font-display text-lg font-bold text-brand-700">{formatCurrency(balance)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)" required error={error}>
            <Input type="number" value={amount} min={1} max={balance} onChange={(e) => setAmount(e.target.value)} invalid={!!error} />
          </Field>
          <Field label="Payment mode" required>
            <Select value={mode} options={PAYMENT_MODES} onChange={(e) => setMode(e.target.value as PaymentMode)} />
          </Field>
          <Field label="Reference / UTR" className="sm:col-span-2">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
