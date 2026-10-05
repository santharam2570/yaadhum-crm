export type BatchStatus = "Upcoming" | "Ongoing" | "Completed";

export interface Batch {
  id: string;
  name: string;
  course: string;
  trainer: string;
  startDate: string;
  endDate: string;
  timing: string;
  capacity: number;
  enrolled: number;
  status: BatchStatus;
}
