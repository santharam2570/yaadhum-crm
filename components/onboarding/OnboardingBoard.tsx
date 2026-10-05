"use client";

import { useState } from "react";
import { BookOpen, CalendarDays, GripVertical } from "lucide-react";
import type { Onboarding, OnboardingStage } from "@/types/onboarding";
import { moveOnboarding, ONBOARDING_STAGES } from "@/services/onboardingService";
import { cn, formatDate, todayISO } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import type { RowContext } from "@/components/common/ResourcePage";

const STAGE_ACCENT: Record<OnboardingStage, string> = {
  "Welcome Call": "bg-sky-500",
  Documents: "bg-violet-500",
  "Fee Payment": "bg-ember-500",
  "Batch Allocation": "bg-amber-500",
  Orientation: "bg-brand-500",
  Completed: "bg-emerald-500",
  Dropped: "bg-stone-400",
};

export function OnboardingBoard({ rows, ctx }: { rows: Onboarding[]; ctx: RowContext<Onboarding> }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<OnboardingStage | null>(null);
  const today = todayISO();

  const move = async (id: string, stage: OnboardingStage) => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.stage === stage) return;
    await moveOnboarding(row, stage);
    ctx.toast(stage === "Completed" ? `${row.candidateName} onboarded and enrolled as a student` : `Moved ${row.candidateName} to ${stage}`);
  };

  return (
    <div className="scrollbar-thin -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {ONBOARDING_STAGES.map((stage) => {
        const items = rows.filter((r) => r.stage === stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              if (!ctx.canEdit) return;
              e.preventDefault();
              setOver(stage);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              if (dragId) move(dragId, stage);
            }}
            className={cn(
              "flex w-64 shrink-0 flex-col rounded-2xl bg-cream-50 ring-1 ring-brand-100/60 transition",
              over === stage && "bg-brand-50 ring-2 ring-brand-300",
            )}
          >
            <div className="flex items-center gap-2 px-4 pb-2 pt-3">
              <span className={cn("h-2.5 w-2.5 rounded-full", STAGE_ACCENT[stage])} />
              <p className="font-display text-sm font-bold tracking-wide text-ink-900">{stage}</p>
              <span className="rounded-full bg-white px-2 text-[11px] font-semibold text-stone-500 ring-1 ring-brand-100">{items.length}</span>
            </div>
            <div className="flex min-h-32 flex-1 flex-col gap-2 p-2">
              {items.map((o) => {
                const late = o.stage !== "Completed" && o.stage !== "Dropped" && o.targetDate < today;
                return (
                  <div
                    key={o.id}
                    draggable={ctx.canEdit}
                    onDragStart={() => setDragId(o.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => ctx.open(o)}
                    className={cn(
                      "group cursor-pointer rounded-xl border border-brand-100/70 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md",
                      dragId === o.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={o.candidateName} size="sm" />
                        <p className="truncate text-sm font-semibold text-ink-900">{o.candidateName}</p>
                      </div>
                      {ctx.canEdit && <GripVertical className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-stone-500" />}
                    </div>
                    <p className="mt-2 flex items-center gap-1 truncate text-xs text-stone-500">
                      <BookOpen className="h-3 w-3 shrink-0" /> {o.course}
                    </p>
                    <div className="mt-2 flex items-center justify-between border-t border-brand-50 pt-2 text-[11px] text-stone-500">
                      <span className={cn("flex items-center gap-1", late && "font-semibold text-brand-700")}>
                        <CalendarDays className="h-3 w-3" /> {formatDate(o.targetDate, { day: "2-digit", month: "short" })}
                      </span>
                      <span>{o.owner.split(" ")[0]}</span>
                    </div>
                  </div>
                );
              })}
              {!items.length && (
                <p className="rounded-xl border border-dashed border-brand-200 py-6 text-center text-xs text-stone-400">Drop candidates here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
