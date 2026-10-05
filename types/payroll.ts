export type PayrollStatus = "Pending" | "Processed" | "Paid";

export interface Payroll {
  id: string;
  employeeName: string;
  department: string;
  month: string;
  basic: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  paidOn?: string;
}
