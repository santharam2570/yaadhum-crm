import { useSyncExternalStore } from "react";
import type { RoleKey } from "./permissions";

export interface Session {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
}

const SESSION_KEY = "yaadhum:session";
const SESSION_EVENT = "yaadhum:session";

export const DEMO_ACCOUNTS: (Session & { password: string })[] = [
  { id: "usr_admin", name: "Santha Kumar", email: "admin@yaadhum.com", password: "admin123", role: "admin" },
  { id: "usr_mgr", name: "Priya Raman", email: "manager@yaadhum.com", password: "manager123", role: "manager" },
  { id: "usr_cns", name: "Karthik Selvam", email: "counsellor@yaadhum.com", password: "counsellor123", role: "counsellor" },
  { id: "usr_hr", name: "Divya Lakshmi", email: "hr@yaadhum.com", password: "hr123", role: "hr" },
  { id: "usr_acc", name: "Arun Prakash", email: "accounts@yaadhum.com", password: "accounts123", role: "accountant" },
];

let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

function setSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function login(email: string, password: string): Promise<Session> {
  await new Promise((r) => setTimeout(r, 400));
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  if (!account) throw new Error("Invalid email or password");
  const { password: _pw, ...session } = account;
  setSession(session);
  return session;
}

export function logout() {
  setSession(null);
}

/** Demo helper: switch the signed-in user's role to preview permissions. */
export function switchRole(role: RoleKey) {
  const current = getSession();
  if (current) setSession({ ...current, role });
}

function subscribe(cb: () => void) {
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Returns `undefined` during SSR/hydration, `null` when signed out. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, getSession, () => undefined);
}
