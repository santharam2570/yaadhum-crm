export type AttendanceStatus = "Present" | "Absent" | "Late" | "Half Day" | "Leave";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}
