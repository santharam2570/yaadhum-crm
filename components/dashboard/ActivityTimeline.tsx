import Link from "next/link";
import {
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  ListTodo,
  PhoneCall,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@/types/common";
import { cn, timeAgo } from "@/lib/utils";

export const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; tone: string; label: string }> = {
  lead: { icon: UserPlus, tone: "bg-brand-50 text-brand-600", label: "Lead" },
  student: { icon: GraduationCap, tone: "bg-violet-50 text-violet-600", label: "Student" },
  admission: { icon: ClipboardList, tone: "bg-sky-50 text-sky-600", label: "Admission" },
  payment: { icon: CreditCard, tone: "bg-emerald-50 text-emerald-600", label: "Payment" },
  followup: { icon: PhoneCall, tone: "bg-orange-50 text-ember-600", label: "Follow-up" },
  task: { icon: ListTodo, tone: "bg-amber-50 text-amber-600", label: "Task" },
  hr: { icon: Briefcase, tone: "bg-stone-100 text-ink-700", label: "HR" },
  document: { icon: FileText, tone: "bg-cream-100 text-brand-800", label: "Document" },
};

export function ActivityTimeline({ items, compact }: { items: Activity[]; compact?: boolean }) {
  return (
    <ol className="relative space-y-5">
      <span className="absolute bottom-2 left-[17px] top-2 w-px bg-brand-100" />
      {items.map((a) => {
        const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.task;
        const Icon = meta.icon;
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className={cn("relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white", meta.tone)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <Link href={`/activities/${a.id}`} className="text-sm font-semibold text-ink-900 hover:text-brand-700">
                  {a.title}
                </Link>
                <span className="text-[11px] text-stone-400">{timeAgo(a.timestamp)}</span>
              </div>
              <p className={cn("text-sm text-stone-500", compact && "line-clamp-1")}>{a.description}</p>
              {!compact && <p className="mt-0.5 text-[11px] text-stone-400">by {a.user}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
