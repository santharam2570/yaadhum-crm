"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ToastProvider } from "@/components/common/Toast";
import { LogoMark } from "./LogoMark";
import { moduleForPath } from "./navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const PUBLIC_ROUTES = ["/login"];

function SplashScreen() {
  return (
    <div className="bg-sidebar flex min-h-screen flex-col items-center justify-center gap-4">
      <LogoMark size={72} className="animate-pulse" />
      <p className="font-display text-sm font-semibold tracking-[0.35em] text-brand-300">YAADHUM CRM</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, can } = usePermission();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (session === null && !isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [session, isPublic, pathname, router]);

  if (isPublic) return <ToastProvider>{children}</ToastProvider>;
  if (!session) return <SplashScreen />;

  const module = moduleForPath(pathname);
  const allowed = !module || can(module);

  return (
    <ToastProvider>
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="lg:pl-72 print:pl-0">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0">
          {allowed ? (
            children
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="Access restricted"
              message="Your role doesn't have permission to view this module. Ask an administrator for access."
              action={
                <Link href="/dashboard">
                  <Button>Back to dashboard</Button>
                </Link>
              }
            />
          )}
        </main>
      </div>
      <AssistantWidget />
    </ToastProvider>
  );
}
