export type AdmissionStatus = "Pending" | "Under Review" | "Approved" | "Enrolled" | "Rejected";

export interface Admission {
  id: string;
  applicationNo: string;
  studentName: string;
  email: string;
  phone: string;
  course: string;
  appliedOn: string;
  counsellor: string;
  qualification?: string;
  status: AdmissionStatus;
  remarks?: string;
}
