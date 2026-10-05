"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarCheck, CreditCard, UserPlus } from "lucide-react";
import { useSession } from "@/lib/auth";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({ followupsToday }: { followupsToday: number }) {
  const session = useSession();
  const first = session?.name.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-sidebar relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-brand-950/20 sm:p-8">
      <div className="absolute -right-10 -top-16 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 hidden h-full items-center pr-8 opacity-90 md:flex">
        <Image src="/logo-mark.jpg" alt="" width={150} height={150} className="logo-ring rounded-full" />
      </div>
      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-300">{today}</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Vanakkam, {first}! <span className="text-brand-gradient">{greeting()}.</span>
        </h2>
        <p className="mt-2 text-sm text-stone-300">
          You have <b className="text-white">{followupsToday}</b> follow-up{followupsToday === 1 ? "" : "s"} lined up today. Here&apos;s
          how Yaadhum is performing.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { href: "/leads", label: "Add lead", icon: UserPlus },
            { href: "/payments", label: "Record payment", icon: CreditCard },
            { href: "/hr/attendance", label: "Mark attendance", icon: CalendarCheck },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/15 backdrop-blur transition hover:bg-brand-600"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
