import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarOff,
  ChartColumn,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListTodo,
  PartyPopper,
  PhoneCall,
  Receipt,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: ModuleKey;
  children?: { label: string; href: string; icon: LucideIcon }[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" }],
  },
  {
    label: "CRM",
    items: [
      { label: "Leads", href: "/leads", icon: UserPlus, module: "leads" },
      { label: "Onboarding", href: "/onboarding", icon: Rocket, module: "onboarding" },
      { label: "Follow-ups", href: "/followups", icon: PhoneCall, module: "followups" },
      { label: "Tasks", href: "/tasks", icon: ListTodo, module: "tasks" },
      { label: "Activities", href: "/activities", icon: Activity, module: "activities" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Students", href: "/students", icon: GraduationCap, module: "students" },
      { label: "Admissions", href: "/admissions", icon: ClipboardList, module: "admissions" },
      { label: "Courses", href: "/courses", icon: BookOpen, module: "courses" },
      { label: "Batches", href: "/batches", icon: Layers, module: "batches" },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "HR",
        href: "/hr",
        icon: Briefcase,
        module: "hr",
        children: [
          { label: "Employees", href: "/hr/employees", icon: Users },
          { label: "Attendance", href: "/hr/attendance", icon: CalendarCheck },
          { label: "Leaves", href: "/hr/leaves", icon: CalendarOff },
          { label: "Holidays", href: "/hr/holidays", icon: PartyPopper },
          { label: "Payroll", href: "/hr/payroll", icon: Wallet },
          { label: "Performance", href: "/hr/performance", icon: Award },
          { label: "Departments", href: "/hr/departments", icon: Building2 },
        ],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fees", href: "/fees", icon: Receipt, module: "fees" },
      { label: "Payments", href: "/payments", icon: CreditCard, module: "payments" },
      { label: "Documents", href: "/documents", icon: FileText, module: "documents" },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: ChartColumn,
        module: "reports",
        children: [
          { label: "CRM", href: "/reports/crm", icon: Target },
          { label: "Students", href: "/reports/students", icon: GraduationCap },
          { label: "HR", href: "/reports/hr", icon: Briefcase },
          { label: "Finance", href: "/reports/finance", icon: Wallet },
          { label: "Analytics", href: "/reports/analytics", icon: Activity },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, module: "notifications" },
      { label: "Users", href: "/users", icon: UserCog, module: "users" },
      { label: "Roles", href: "/roles", icon: ShieldCheck, module: "roles" },
      { label: "Settings", href: "/settings", icon: Settings, module: "settings" },
    ],
  },
];

/** Maps a pathname to the module that guards it. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const first = pathname.split("/")[1];
  for (const g of NAVIGATION) {
    for (const item of g.items) {
      if (item.href === `/${first}`) return item.module;
    }
  }
  return null;
}
