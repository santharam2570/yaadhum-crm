import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Activity, ActivityType, Followup, FollowupType, Task } from "@/types/common";
import { COUNSELLORS, EMPLOYEE_NAMES } from "./employeeService";

const FOLLOWUP_TYPES: FollowupType[] = ["Call", "WhatsApp", "Email", "Meeting", "Visit"];
const LEADS_FOR_FOLLOWUP = [
  "Ashwin Kumar", "Chitra Devi", "Dinesh Pandian", "Gayathri Nair", "Indhu Mathi",
  "Jagan Mohan", "Madhu Mitha", "Pavithra Suresh", "Ragul Dev", "Sangeetha P",
  "Vasanth Raj", "Yamini Krishnan", "Akash Varma", "Nithya Shree",
];

export const followupService = createCollection<Followup>("followups", () =>
  LEADS_FOR_FOLLOWUP.map((leadName, i) => {
    const offset = i - 5;
    return {
      id: `fup_${i + 1}`,
      leadName,
      type: pick(FOLLOWUP_TYPES, i),
      dueDate: daysFromToday(offset),
      dueTime: pick(["10:00", "11:30", "14:00", "16:30", "18:00"], i),
      assignedTo: pick(COUNSELLORS, i),
      status: offset < 0 ? (i % 3 === 0 ? "Missed" : "Completed") : "Scheduled",
      notes: pick(
        [
          "Share fee structure and EMI plan.",
          "Invite for free demo class on Saturday.",
          "Parent wants to visit the campus.",
          "Send placement record brochure.",
          "Discuss scholarship eligibility.",
        ],
        i,
      ),
    };
  }),
);

const TASKS: [string, Task["priority"], string][] = [
  ["Prepare monthly admissions report", "High", "Reports"],
  ["Call back walk-in enquiries", "Urgent", "Leads"],
  ["Upload September attendance sheet", "Medium", "HR"],
  ["Verify fee receipts for FSD batch", "High", "Finance"],
  ["Schedule demo class for DSA", "Medium", "Courses"],
  ["Update Instagram ad creatives", "Low", "Marketing"],
  ["Collect pending student documents", "High", "Documents"],
  ["Process October payroll", "Urgent", "HR"],
  ["Plan placement drive with partners", "Medium", "Students"],
  ["Renew cloud lab subscriptions", "Low", "Operations"],
];

export const taskService = createCollection<Task>("tasks", () =>
  TASKS.map(([title, priority, relatedTo], i) => ({
    id: `tsk_${i + 1}`,
    title,
    priority,
    status: pick(["Todo", "In Progress", "Done", "Todo"] as const, i),
    dueDate: daysFromToday(i - 3),
    assignee: pick(EMPLOYEE_NAMES, i + 1),
    relatedTo,
    description: "",
  })),
);

const ACTIVITIES: [ActivityType, string, string][] = [
  ["lead", "New lead captured", "Ashwin Kumar enquired about Full Stack Development via Website."],
  ["payment", "Payment received", "₹25,000 received from Aarthi Murugan via UPI."],
  ["admission", "Admission approved", "APP-26-303 for Data Science & AI was approved."],
  ["followup", "Follow-up completed", "Call with Chitra Devi — interested in weekend batch."],
  ["student", "Student enrolled", "Kavin Kumar joined batch FSD-2026-A4."],
  ["hr", "Leave approved", "Revathi Ganesh's casual leave was approved."],
  ["task", "Task completed", "Verify fee receipts for FSD batch marked as done."],
  ["document", "Document uploaded", "Offer letter uploaded for Keerthana S."],
  ["lead", "Lead converted", "Gayathri Nair converted to student."],
  ["payment", "Payment received", "₹40,000 received from Harini Sekar via Card."],
  ["admission", "New application", "Manoj Kumar applied for Cloud & DevOps."],
  ["followup", "Follow-up missed", "WhatsApp follow-up with Jagan Mohan was missed."],
];

export const activityService = createCollection<Activity>("activities", () =>
  ACTIVITIES.map(([type, title, description], i) => {
    const d = new Date();
    d.setHours(d.getHours() - i * 5 - 1);
    return {
      id: `act_${i + 1}`,
      type,
      title,
      description,
      user: pick(["Karthik Selvam", "Arun Prakash", "Priya Raman", "Divya Lakshmi"], i),
      timestamp: d.toISOString(),
    };
  }),
);

export function logActivity(type: ActivityType, title: string, description: string, user = "System") {
  return activityService.create({ type, title, description, user, timestamp: new Date().toISOString() });
}
