export type RoleKey = "admin" | "manager" | "counsellor" | "hr" | "accountant";
export type Action = "view" | "create" | "edit" | "delete";

export type ModuleKey =
  | "dashboard"
  | "leads"
  | "students"
  | "admissions"
  | "courses"
  | "batches"
  | "onboarding"
  | "followups"
  | "tasks"
  | "activities"
  | "hr"
  | "documents"
  | "fees"
  | "payments"
  | "reports"
  | "notifications"
  | "users"
  | "roles"
  | "settings";

export const ROLES: { key: RoleKey; label: string; description: string }[] = [
  { key: "admin", label: "Administrator", description: "Full access to every module and setting." },
  { key: "manager", label: "Manager", description: "Runs CRM, academics and reports. No system admin." },
  { key: "counsellor", label: "Counsellor", description: "Works leads, follow-ups, admissions and students." },
  { key: "hr", label: "HR Executive", description: "Manages employees, attendance, leave and payroll." },
  { key: "accountant", label: "Accountant", description: "Handles fees, payments and finance reports." },
];

export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "students", label: "Students" },
  { key: "admissions", label: "Admissions" },
  { key: "courses", label: "Courses" },
  { key: "batches", label: "Batches" },
  { key: "onboarding", label: "Onboarding" },
  { key: "followups", label: "Follow-ups" },
  { key: "tasks", label: "Tasks" },
  { key: "activities", label: "Activities" },
  { key: "hr", label: "HR" },
  { key: "documents", label: "Documents" },
  { key: "fees", label: "Fees" },
  { key: "payments", label: "Payments" },
  { key: "reports", label: "Reports" },
  { key: "notifications", label: "Notifications" },
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles" },
  { key: "settings", label: "Settings" },
];

export const ACTIONS: Action[] = ["view", "create", "edit", "delete"];

type Matrix = Record<RoleKey, Partial<Record<ModuleKey, Action[]>>>;

const ALL: Action[] = ["view", "create", "edit", "delete"];
const RW: Action[] = ["view", "create", "edit"];
const R: Action[] = ["view"];

const everything = (actions: Action[]) =>
  Object.fromEntries(MODULES.map((m) => [m.key, actions])) as Record<ModuleKey, Action[]>;

export const DEFAULT_MATRIX: Matrix = {
  admin: everything(ALL),
  manager: {
    ...everything(ALL),
    users: R,
    roles: R,
    settings: R,
  },
  counsellor: {
    dashboard: R,
    leads: RW,
    students: RW,
    admissions: RW,
    courses: R,
    batches: R,
    onboarding: RW,
    followups: ALL,
    tasks: ALL,
    activities: R,
    documents: RW,
    fees: R,
    reports: R,
    notifications: R,
  },
  hr: {
    dashboard: R,
    hr: ALL,
    tasks: ALL,
    activities: R,
    documents: ALL,
    reports: R,
    notifications: R,
    users: R,
  },
  accountant: {
    dashboard: R,
    students: R,
    courses: R,
    fees: ALL,
    payments: ALL,
    documents: RW,
    tasks: RW,
    reports: R,
    notifications: R,
    hr: R,
  },
};

const STORAGE_KEY = "yaadhum:permissions";
export const PERMISSIONS_EVENT = "yaadhum:permissions";

export function getMatrix(): Matrix {
  if (typeof window === "undefined") return DEFAULT_MATRIX;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_MATRIX;
  try {
    const saved = JSON.parse(raw) as Matrix;
    // Matrices saved before Onboarding replaced Opportunities carry the old key.
    for (const role of Object.keys(saved) as RoleKey[]) {
      const perms = saved[role] as Record<string, Action[]>;
      if (perms.opportunities && !perms.onboarding) perms.onboarding = perms.opportunities;
      delete perms.opportunities;
    }
    return { ...DEFAULT_MATRIX, ...saved };
  } catch {
    return DEFAULT_MATRIX;
  }
}

export function saveMatrix(matrix: Matrix) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  window.dispatchEvent(new Event(PERMISSIONS_EVENT));
}

export function resetMatrix() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(PERMISSIONS_EVENT));
}

export function can(role: RoleKey | undefined, module: ModuleKey, action: Action = "view") {
  if (!role) return false;
  if (role === "admin") return true;
  return getMatrix()[role]?.[module]?.includes(action) ?? false;
}

export function roleLabel(role: RoleKey) {
  return ROLES.find((r) => r.key === role)?.label ?? role;
}
