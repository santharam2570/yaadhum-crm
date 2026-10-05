export type StudentStatus = "Active" | "Completed" | "Dropped" | "On Hold";

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  enrollmentDate: string;
  guardianName?: string;
  guardianPhone?: string;
  city?: string;
  status: StudentStatus;
}
