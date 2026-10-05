export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
export type LeadSource =
  | "Website"
  | "Walk-in"
  | "Referral"
  | "Facebook"
  | "Instagram"
  | "Google Ads"
  | "Seminar"
  | "WhatsApp";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  courseInterest: string;
  status: LeadStatus;
  assignedTo: string;
  city?: string;
  createdAt: string;
  notes?: string;
}
