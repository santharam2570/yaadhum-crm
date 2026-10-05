import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { FeeAccount, FeeStatus, Payment, PaymentMode } from "@/types/payment";
import { STUDENT_NAMES, studentCourse } from "./studentService";

export const PAYMENT_MODES: PaymentMode[] = ["UPI", "Cash", "Card", "Bank Transfer", "Cheque"];

export const paymentService = createCollection<Payment>("payments", () => {
  const rows: Payment[] = [];
  let n = 1001;
  STUDENT_NAMES.forEach((studentName, i) => {
    const course = studentCourse(i);
    const installments = (i % 3) + 1;
    for (let k = 0; k < installments; k++) {
      rows.push({
        id: `pmt_${i + 1}_${k + 1}`,
        receiptNo: `RCPT-${n++}`,
        studentName,
        course: course.name,
        amount: Math.round(course.fee / 3 / 500) * 500,
        mode: pick(PAYMENT_MODES, i + k),
        date: daysFromToday(-((i * 11 + k * 37) % 175)),
        status: (i + k) % 13 === 5 ? "Pending" : (i + k) % 17 === 8 ? "Failed" : "Success",
        reference: `TXN${(884210 + i * 97 + k).toString()}`,
      });
    }
  });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
});

export function feeStatus(fee: Pick<FeeAccount, "totalFee" | "discount" | "paid" | "dueDate">): FeeStatus {
  const net = fee.totalFee - (fee.discount || 0);
  if (fee.paid >= net) return "Paid";
  if (new Date(fee.dueDate) < new Date()) return "Overdue";
  return fee.paid > 0 ? "Partial" : "Unpaid";
}

export const feeService = createCollection<FeeAccount>("fees", () =>
  STUDENT_NAMES.map((studentName, i) => {
    const course = studentCourse(i);
    const installments = (i % 3) + 1;
    const discount = i % 4 === 0 ? 5000 : 0;
    const paid = Math.min(course.fee - discount, Math.round(course.fee / 3 / 500) * 500 * installments);
    const base = { totalFee: course.fee, discount, paid, dueDate: daysFromToday(-20 + i * 4) };
    return {
      id: `fee_${i + 1}`,
      studentName,
      course: course.name,
      installments: 3,
      ...base,
      status: feeStatus(base),
    };
  }),
);
