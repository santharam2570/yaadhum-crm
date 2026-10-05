import Link from "next/link";
import { LogoMark } from "@/components/layout/LogoMark";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <LogoMark size={80} />
      <p className="mt-6 font-display text-6xl font-bold text-brand-gradient">404</p>
      <p className="mt-2 text-stone-500">This page doesn&apos;t exist in Yaadhum CRM.</p>
      <Link href="/dashboard" className="mt-6 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white">
        Go to dashboard
      </Link>
    </div>
  );
}
