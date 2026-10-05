"use client";

import { CheckCircle2, Rocket, Timer, UserMinus } from "lucide-react";
import type { Onboarding, OnboardingStage } from "@/types/onboarding";
import { moveOnboarding, ONBOARDING_FLOW, ONBOARDING_STAGES, onboardingService } from "@/services/onboardingService";
import { getBatchOptions } from "@/services/batchService";
import { COURSE_NAMES, getCourseOptions } from "@/services/courseService";
import { COUNSELLORS } from "@/services/employeeService";
import { daysFromToday, todayISO } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import { DateText, PersonCell, Progress, TitleCell } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";
import { OnboardingBoard } from "./OnboardingBoard";

export const onboardingConfig: ResourceConfig<Onboarding> = {
  entityName: "Onboarding",
  module: "onboarding",
  service: onboardingService,
  basePath: "/onboarding",
  fields: [
    { name: "candidateName", label: "Candidate name", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "course", label: "Course", type: "select", required: true, optionsLoader: getCourseOptions },
    { name: "stage", label: "Stage", type: "select", required: true, options: ONBOARDING_STAGES },
    { name: "owner", label: "Owner", type: "select", required: true, options: COUNSELLORS },
    { name: "batch", label: "Batch", type: "select", optionsLoader: getBatchOptions },
    { name: "startDate", label: "Started on", type: "date", required: true },
    { name: "targetDate", label: "Target completion", type: "date", required: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
  defaults: () => ({ stage: "Welcome Call", startDate: todayISO(), targetDate: daysFromToday(21) }),
  onStatusChange: (row, stage) => moveOnboarding(row, stage as OnboardingStage),
};

/** Share of the onboarding flow completed, 0–100. */
export function onboardingProgress(stage: OnboardingStage) {
  if (stage === "Dropped") return 0;
  return Math.round((ONBOARDING_FLOW.indexOf(stage) / (ONBOARDING_FLOW.length - 1)) * 100);
}

export function OnboardingView() {
  const today = todayISO();
  return (
    <ResourcePage<Onboarding>
      {...onboardingConfig}
      title="Onboarding"
      description="Converted leads move through onboarding until they join a batch as students. Drag cards between stages."
      searchKeys={["candidateName", "phone", "email", "course", "owner"]}
      filters={[
        { key: "stage", label: "Stages", options: ONBOARDING_STAGES },
        { key: "course", label: "Courses", options: COURSE_NAMES },
        { key: "owner", label: "Owners", options: COUNSELLORS },
      ]}
      stats={(rows) => {
        const active = rows.filter((r) => r.stage !== "Completed" && r.stage !== "Dropped");
        return [
          { label: "In Progress", value: active.length, icon: Rocket },
          { label: "Past Target", value: active.filter((r) => r.targetDate < today).length, icon: Timer, accent: "ember" },
          { label: "Completed", value: rows.filter((r) => r.stage === "Completed").length, icon: CheckCircle2, accent: "cream" },
          { label: "Dropped", value: rows.filter((r) => r.stage === "Dropped").length, icon: UserMinus, accent: "dark" },
        ];
      }}
      renderBoard={(rows, ctx) => <OnboardingBoard rows={rows} ctx={ctx} />}
      columns={[
        { key: "candidateName", header: "Candidate", render: (r) => <PersonCell name={r.candidateName} sub={r.phone} /> },
        { key: "course", header: "Course", render: (r) => <TitleCell title={r.course} sub={r.batch ?? "Batch not assigned"} />, hideBelow: "md" },
        { key: "stage", header: "Stage", render: (r) => <StatusBadge status={r.stage} /> },
        { key: "progress", header: "Progress", render: (r) => <Progress value={onboardingProgress(r.stage)} />, sortValue: (r) => onboardingProgress(r.stage), hideBelow: "lg" },
        { key: "targetDate", header: "Target", render: (r) => <DateText value={r.targetDate} />, hideBelow: "sm" },
        { key: "owner", header: "Owner", hideBelow: "lg" },
      ]}
    />
  );
}
