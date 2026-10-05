import type { RoleKey } from "@/lib/permissions";

export type FollowupType = "Call" | "Email" | "WhatsApp" | "Meeting" | "Visit";
export type FollowupStatus = "Scheduled" | "Completed" | "Missed";

export interface Followup {
  id: string;
  leadName: string;
  type: FollowupType;
  dueDate: string;
  dueTime?: string;
  assignedTo: string;
  status: FollowupStatus;
  notes?: string;
}

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "Todo" | "In Progress" | "Done";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
  relatedTo?: string;
  description?: string;
}

export type ActivityType =
  | "lead"
  | "student"
  | "admission"
  | "payment"
  | "followup"
  | "task"
  | "hr"
  | "document";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  timestamp: string;
}

export type NotificationKind = "info" | "success" | "warning" | "alert";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleKey;
  status: "Active" | "Inactive";
  lastLogin?: string;
}

export interface OrgSettings {
  id: string;
  companyName: string;
  appName: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  currency: string;
  timezone: string;
  academicYear: string;
  receiptPrefix: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
}
