"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { BrandLockup } from "./LogoMark";
import { NAVIGATION } from "./navigation";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const first = `/${pathname.split("/")[1]}`;
    setExpanded((e) => ({ ...e, [first]: true }));
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div
        className={cn("fixed inset-0 z-30 bg-ink-950/60 backdrop-blur-sm lg:hidden", open ? "block" : "hidden")}
        onClick={onClose}
      />
      <aside
        className={cn(
          "bg-sidebar fixed inset-y-0 left-0 z-40 flex w-72 flex-col text-stone-300 transition-transform duration-300 print:hidden lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <Link href="/dashboard">
            <BrandLockup />
          </Link>
          <button onClick={onClose} className="rounded-md p-1 text-stone-400 hover:text-white lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAVIGATION.map((group) => {
            const items = group.items.filter((i) => can(i.module));
            if (!items.length) return null;
            return (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-300/60">{group.label}</p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    if (item.children) {
                      const isOpen = expanded[item.href];
                      return (
                        <li key={item.href}>
                          <button
                            onClick={() => setExpanded((e) => ({ ...e, [item.href]: !e[item.href] }))}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                              active ? "text-white" : "hover:bg-white/5 hover:text-white",
                            )}
                          >
                            <Icon className={cn("h-[18px] w-[18px]", active && "text-brand-400")} />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown className={cn("h-4 w-4 transition", isOpen && "rotate-180")} />
                          </button>
                          {isOpen && (
                            <ul className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                              <li>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    "block rounded-md px-3 py-1.5 text-[13px] transition",
                                    pathname === item.href ? "bg-brand-gradient font-semibold text-white" : "hover:text-white",
                                  )}
                                >
                                  Overview
                                </Link>
                              </li>
                              {item.children.map((c) => (
                                <li key={c.href}>
                                  <Link
                                    href={c.href}
                                    className={cn(
                                      "block rounded-md px-3 py-1.5 text-[13px] transition",
                                      isActive(c.href) ? "bg-brand-gradient font-semibold text-white" : "hover:text-white",
                                    )}
                                  >
                                    {c.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    }
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                            active
                              ? "bg-brand-gradient text-white shadow-lg shadow-brand-900/40"
                              : "hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <Icon className={cn("h-[18px] w-[18px]", !active && "text-stone-400 group-hover:text-brand-400")} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <div className="rounded-xl bg-gradient-to-br from-brand-900/60 to-ink-900 p-3 ring-1 ring-brand-800/40">
            <p className="font-display text-sm font-bold tracking-wide text-white">Yaadhum International</p>
            <p className="text-[11px] text-stone-400">Technologies · CRM v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
