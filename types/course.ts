export type CourseMode = "Offline" | "Online" | "Hybrid";
export type CourseStatus = "Active" | "Draft" | "Inactive";

export interface Course {
  id: string;
  code: string;
  name: string;
  category: string;
  durationMonths: number;
  fee: number;
  mode: CourseMode;
  status: CourseStatus;
  description?: string;
}
