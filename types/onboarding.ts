export type OnboardingStage =
  | "Welcome Call"
  | "Documents"
  | "Fee Payment"
  | "Batch Allocation"
  | "Orientation"
  | "Completed"
  | "Dropped";

export interface Onboarding {
  id: string;
  candidateName: string;
  email: string;
  phone: string;
  course: string;
  stage: OnboardingStage;
  owner: string;
  leadId?: string;
  batch?: string;
  startDate: string;
  targetDate: string;
  notes?: string;
}
