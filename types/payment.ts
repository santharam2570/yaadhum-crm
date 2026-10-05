export type PaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Cheque";
export type PaymentStatus = "Success" | "Pending" | "Failed" | "Refunded";

export interface Payment {
  id: string;
  receiptNo: string;
  studentName: string;
  course: string;
  amount: number;
  mode: PaymentMode;
  date: string;
  status: PaymentStatus;
  reference?: string;
}

export type FeeStatus = "Paid" | "Partial" | "Unpaid" | "Overdue";

export interface FeeAccount {
  id: string;
  studentName: string;
  course: string;
  totalFee: number;
  discount: number;
  paid: number;
  dueDate: string;
  installments: number;
  status: FeeStatus;
}
