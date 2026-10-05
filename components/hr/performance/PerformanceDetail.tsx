"use client";

import { Award, CheckCircle2, Star, Target, TrendingUp } from "lucide-react";
import type { PerformanceReview } from "@/types/employee";
import { performanceService } from "@/services/employeeService";
import { useResource } from "@/hooks/useResource";
import { sum } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Progress } from "@/components/common/Cells";
import { DetailPage } from "@/components/common/DetailPage";
import { RelatedCard, RelatedRow, StatusStepper } from "@/components/common/Related";
import { EmployeeLinkCard } from "@/components/hr/employees/EmployeeLinkCard";
import { HR_CRUMBS } from "@/components/hr/employees/EmployeesView";
import { performanceConfig, Stars } from "./PerformanceView";

function band(rating: number) {
  if (rating >= 4.5) return "Outstanding";
  if (rating >= 4) return "Exceeds expectations";
  if (rating >= 3) return "Meets expectations";
  if (rating >= 2) return "Needs improvement";
  return "Unsatisfactory";
}

export function PerformanceDetail({ id }: { id: string }) {
  const reviews = useResource(performanceService).data;

  return (
    <DetailPage<PerformanceReview>
      {...performanceConfig}
      basePath="/hr/performance"
      parents={HR_CRUMBS}
      id={id}
      listLabel="Performance"
      avatar={Award}
      title={(r) => `${r.employeeName} — ${r.period}`}
      subtitle={(r) => `Reviewed by ${r.reviewer} · ${band(r.rating)}`}
      status={(r) => r.status}
      sections={[
        { title: "Review", items: ["employeeName", "reviewer", "period", "status"] },
        {
          title: "Assessment",
          items: [
            { key: "rating", label: "Rating", render: (r) => <Stars value={r.rating} /> },
            { key: "goalsMet", label: "Goals met", render: (r) => <div className="max-w-56"><Progress value={r.goalsMet} /></div> },
            "comments",
          ],
        },
      ]}
      stats={(r) => {
        const history = reviews.filter((o) => o.employeeName === r.employeeName);
        const avg = history.length ? sum(history, (o) => o.rating) / history.length : r.rating;
        const peers = reviews.filter((o) => o.period === r.period);
        const rank = [...peers].sort((a, b) => b.rating - a.rating).findIndex((o) => o.id === r.id) + 1;
        return [
          { label: "Rating", value: r.rating.toFixed(1), icon: Star, hint: band(r.rating) },
          { label: "Goals met", value: `${r.goalsMet}%`, icon: Target, accent: "ember" },
          { label: "Career average", value: avg.toFixed(1), icon: TrendingUp, accent: "cream", hint: `${history.length} reviews` },
          { label: `Rank in ${r.period}`, value: rank ? `#${rank} of ${peers.length}` : "—", icon: Award, accent: "dark" },
        ];
      }}
      actions={(r, ctx) =>
        ctx.canEdit && r.status !== "Completed" ? (
          <Button
            variant="dark"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={async () => {
              await ctx.update({ status: r.status === "Draft" ? "Pending" : "Completed" });
              ctx.toast(r.status === "Draft" ? "Review submitted" : "Review completed");
            }}
          >
            {r.status === "Draft" ? "Submit review" : "Complete review"}
          </Button>
        ) : null
      }
      main={(r) => {
        const history = reviews.filter((o) => o.employeeName === r.employeeName && o.id !== r.id);
        return (
          <>
            <Card>
              <CardHeader title="Review workflow" />
              <div className="p-5">
                <StatusStepper steps={["Draft", "Pending", "Completed"]} current={r.status} />
              </div>
            </Card>
            <RelatedCard title="Other reviews" count={history.length} empty="This is the only review for this employee.">
              {history.map((o) => (
                <RelatedRow key={o.id} href={`/hr/performance/${o.id}`} title={o.period} sub={`By ${o.reviewer} · ${o.goalsMet}% goals met`} trailing={<Stars value={o.rating} />} />
              ))}
            </RelatedCard>
          </>
        );
      }}
      aside={(r) => (
        <>
          <EmployeeLinkCard title="Employee" name={r.employeeName} />
          <EmployeeLinkCard title="Reviewer" name={r.reviewer} />
          <Card>
            <CardHeader title="Rating band" />
            <div className="p-5">
              <Stars value={r.rating} />
              <p className="mt-2 font-display text-xl font-bold text-brand-700">{band(r.rating)}</p>
            </div>
          </Card>
        </>
      )}
    />
  );
}
