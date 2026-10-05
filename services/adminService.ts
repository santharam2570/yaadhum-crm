import { createCollection } from "@/lib/api";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import type { AppNotification, AppUser, OrgSettings } from "@/types/common";

export const userService = createCollection<AppUser>("users", () => [
  ...DEMO_ACCOUNTS.map(({ password: _pw, ...u }, i) => {
    const d = new Date();
    d.setHours(d.getHours() - i * 7);
    return {
      ...u,
      phone: `+91 98400 ${String(11000 + i * 1234)}`,
      status: "Active" as const,
      lastLogin: d.toISOString(),
    };
  }),
  { id: "usr_6", name: "Meena Kumari", email: "meena@yaadhum.com", phone: "+91 98400 22110", role: "counsellor", status: "Active" },
  { id: "usr_7", name: "Rajesh Kannan", email: "rajesh@yaadhum.com", phone: "+91 98400 33221", role: "counsellor", status: "Inactive" },
]);

const NOTES: [string, string, AppNotification["kind"], string][] = [
  ["5 follow-ups due today", "Your counsellors have 5 follow-ups scheduled for today.", "warning", "/followups"],
  ["Payment received", "₹25,000 received from Aarthi Murugan (RCPT-1001).", "success", "/payments"],
  ["New lead assigned", "Ashwin Kumar was assigned to Karthik Selvam.", "info", "/leads"],
  ["Overdue fees", "4 students have overdue fee balances.", "alert", "/fees"],
  ["Leave request", "Vijay Anand requested 2 days of casual leave.", "info", "/hr/leaves"],
  ["Batch starting soon", "FSD-2026-B1 starts next week — 12/30 seats filled.", "info", "/batches"],
  ["Payroll pending", "October payroll is pending approval.", "warning", "/hr/payroll"],
  ["Document verification", "3 admission documents are awaiting verification.", "warning", "/documents"],
];

export const notificationService = createCollection<AppNotification>("notifications", () =>
  NOTES.map(([title, message, kind, link], i) => {
    const d = new Date();
    d.setHours(d.getHours() - i * 3);
    return { id: `ntf_${i + 1}`, title, message, kind, link, read: i > 3, createdAt: d.toISOString() };
  }),
);

export const settingsService = createCollection<OrgSettings>("settings", () => [
  {
    id: "org",
    companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Yaadhum International Technologies",
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Yaadhum CRM",
    email: "info@yaadhum.com",
    phone: "+91 44 4000 1234",
    address: "No. 21, Anna Salai, Teynampet, Chennai, Tamil Nadu 600018",
    gstin: "33ABCDE1234F1Z5",
    currency: "INR",
    timezone: "Asia/Kolkata",
    academicYear: "2026-27",
    receiptPrefix: "RCPT-",
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
  },
]);

export async function markAllNotificationsRead() {
  const rows = await notificationService.list();
  await Promise.all(rows.filter((n) => !n.read).map((n) => notificationService.update(n.id, { read: true })));
}
