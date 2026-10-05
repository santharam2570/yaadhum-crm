import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-full logo-ring", className)}
      style={{ width: size, height: size }}
    >
      <Image src="/logo-mark.jpg" alt="Yaadhum" width={size * 2} height={size * 2} className="h-full w-full object-cover" priority />
    </span>
  );
}

export function BrandLockup({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={40} />
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-[0.18em] text-white">YAADHUM</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-300">CRM Suite</p>
        </div>
      )}
    </div>
  );
}
