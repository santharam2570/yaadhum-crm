"use client";

import { useState } from "react";
import Image from "next/image";
import { Printer, ReceiptText } from "lucide-react";
import type { Payment } from "@/types/payment";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

export function ReceiptCard({ payment }: { payment: Payment }) {
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <div className="bg-sidebar flex items-center gap-4 p-5 text-white">
          <Image src="/logo-mark.jpg" alt="Yaadhum" width={56} height={56} className="logo-ring rounded-full" />
          <div>
            <p className="font-display text-lg font-bold tracking-[0.15em]">YAADHUM INTERNATIONAL</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand-300">Technologies · Fee Receipt</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Receipt no.</p>
            <p className="font-mono font-semibold">{payment.receiptNo}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Date</p>
            <p className="font-semibold">{formatDate(payment.date)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Received from</p>
            <p className="font-semibold">{payment.studentName}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Course</p>
            <p className="font-semibold">{payment.course}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Mode</p>
            <p className="font-semibold">{payment.mode}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Reference</p>
            <p className="font-mono text-xs font-semibold">{payment.reference || "—"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-brand-200 bg-glow px-5 py-4">
          <StatusBadge status={payment.status} />
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-brand-800">Amount paid</p>
            <p className="font-display text-3xl font-bold text-brand-700">{formatCurrency(payment.amount)}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-stone-400">This is a computer generated receipt and does not require a signature.</p>
    </div>
  );
}

export function ReceiptButton({ payment }: { payment: Payment }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-stone-500 transition hover:bg-brand-50 hover:text-brand-700"
        aria-label="View receipt"
        title="View receipt"
      >
        <ReceiptText className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Receipt ${payment.receiptNo}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      >
        <ReceiptCard payment={payment} />
      </Modal>
    </>
  );
}
