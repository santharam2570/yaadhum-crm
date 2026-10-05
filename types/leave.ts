export type LeaveType = "Casual" | "Sick" | "Earned" | "Maternity" | "Unpaid";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface Leave {
  id: string;
  employeeName: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
}

export type HolidayType = "Public" | "Optional" | "Company";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
}
