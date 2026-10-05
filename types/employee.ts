export type EmployeeStatus = "Active" | "On Leave" | "Inactive";

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  status: EmployeeStatus;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  description?: string;
  location?: string;
}

export type ReviewStatus = "Draft" | "Pending" | "Completed";

export interface PerformanceReview {
  id: string;
  employeeName: string;
  period: string;
  rating: number;
  goalsMet: number;
  reviewer: string;
  status: ReviewStatus;
  comments?: string;
}
