"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, ShieldCheck } from "lucide-react";
import { logout, switchRole, useSession } from "@/lib/auth";
import { ROLES, roleLabel, type RoleKey } from "@/lib/permissions";
import { cn, timeAgo } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import { notificationService } from "@/services/adminService";
import { Avatar } from "@/components/common/Avatar";
import { LogoMark } from "./LogoMark";
import { NAVIGATION } from "./navigation";

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

const SEARCH_INDEX = NAVIGATION.flatMap((g) =>
  g.items.flatMap((i) => [
    { label: i.label, href: i.href, group: g.label },
    ...(i.children ?? []).map((c) => ({ label: `${i.label} · ${c.label}`, href: c.href, group: g.label })),
  ]),
);

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const session = useSession();
  const router = useRouter();
  const { data: notifications } = useResource(notificationService);
  const unread = notifications.filter((n) => !n.read);

  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useClickOutside(() => setMenuOpen(false));
  const bellRef = useClickOutside(() => setBellOpen(false));
  const searchRef = useClickOutside(() => setQuery(""));

  const results = query ? SEARCH_INDEX.filter((s) => s.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];

  return (
    <header className="sticky top-0 z-20 flex h-16 print:hidden items-center gap-3 border-b border-brand-100/60 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-ink-700 hover:bg-brand-50 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <LogoMark size={32} />
        <span className="font-display text-base font-bold tracking-[0.15em] text-ink-900">YAADHUM</span>
      </Link>

      <div ref={searchRef} className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              router.push(results[0].href);
              setQuery("");
            }
          }}
          placeholder="Jump to module… (leads, payroll, reports)"
          className="w-full rounded-full border border-brand-100 bg-cream-50 py-2 pl-9 pr-4 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-xl">
            {results.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                onClick={() => setQuery("")}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-brand-50"
              >
                <span className="font-medium text-ink-800">{r.label}</span>
                <span className="text-xs text-stone-400">{r.group}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded-full p-2 text-ink-700 transition hover:bg-brand-50 hover:text-brand-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unread.length}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-brand-50 px-4 py-3">
                <p className="font-display font-bold">Notifications</p>
                <span className="text-xs text-stone-500">{unread.length} unread</span>
              </div>
              <div className="scrollbar-thin max-h-80 overflow-y-auto">
                {notifications.slice(0, 6).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/notifications"}
                    onClick={() => {
                      setBellOpen(false);
                      if (!n.read) notificationService.update(n.id, { read: true });
                    }}
                    className={cn("block border-b border-brand-50/70 px-4 py-3 hover:bg-cream-50", !n.read && "bg-brand-50/40")}
                  >
                    <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-stone-500">{n.message}</p>
                    <p className="mt-1 text-[10px] text-stone-400">{timeAgo(n.createdAt)}</p>
                  </Link>
                ))}
              </div>
              <Link
                href="/notifications"
                onClick={() => setBellOpen(false)}
                className="block bg-cream-50 py-2.5 text-center text-xs font-semibold text-brand-700 hover:bg-cream-100"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {session && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-brand-50"
            >
              <Avatar name={session.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-ink-900">{session.name}</span>
                <span className="block text-[11px] leading-tight text-stone-500">{roleLabel(session.role)}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-stone-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-xl">
                <div className="border-b border-brand-50 bg-glow px-4 py-3">
                  <p className="text-sm font-bold text-ink-900">{session.name}</p>
                  <p className="text-xs text-ink-600">{session.email}</p>
                </div>
                <div className="border-b border-brand-50 p-2">
                  <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <ShieldCheck className="h-3 w-3" /> Preview as role
                  </p>
                  {ROLES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => switchRole(r.key as RoleKey)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-brand-50",
                        session.role === r.key && "font-semibold text-brand-700",
                      )}
                    >
                      {r.label}
                      {session.role === r.key && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    </button>
                  ))}
                </div>
                <div className="p-2">
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-brand-50"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      router.replace("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
