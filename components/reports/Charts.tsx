"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/common/Card";
import { formatCompact } from "@/lib/utils";

export const CHART_COLORS = ["#e3101a", "#f25c1f", "#7a0a0e", "#ff8a3d", "#bf0a12", "#f3cf94", "#460306", "#ff9d9d"];

type Datum = Record<string, string | number>;
type Formatter = (v: number) => string;

const axisProps = {
  tick: { fill: "#78716c", fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #ffe0e0",
    boxShadow: "0 10px 25px -10px rgba(70,3,6,0.25)",
    fontSize: 12,
  },
  cursor: { fill: "rgba(227,16,26,0.05)" },
};

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} action={action} />
      <div className="p-4">{children}</div>
    </Card>
  );
}

export function TrendArea({
  data,
  series,
  height = 280,
  money,
}: {
  data: Datum[];
  series: { key: string; label: string; color?: string }[];
  height?: number;
  money?: boolean;
}) {
  const fmt: Formatter = (v) => (money ? formatCompact(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? CHART_COLORS[i]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color ?? CHART_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5e6e6" vertical={false} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={fmt} width={56} />
        <Tooltip {...tooltipStyle} formatter={(v) => fmt(Number(v))} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i]}
            strokeWidth={2.5}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({
  data,
  series,
  height = 280,
  money,
  horizontal,
  stacked,
  colorByIndex,
}: {
  data: Datum[];
  series: { key: string; label: string; color?: string }[];
  height?: number;
  money?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  colorByIndex?: boolean;
}) {
  const fmt: Formatter = (v) => (money ? formatCompact(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, left: horizontal ? 8 : -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f5e6e6" vertical={!!horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={fmt} />
            <YAxis type="category" dataKey="name" {...axisProps} width={120} />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              {...axisProps}
              interval={0}
              angle={data.length > 4 ? -25 : 0}
              textAnchor={data.length > 4 ? "end" : "middle"}
              height={data.length > 4 ? 60 : 30}
            />
            <YAxis {...axisProps} tickFormatter={fmt} width={56} />
          </>
        )}
        <Tooltip {...tooltipStyle} formatter={(v) => fmt(Number(v))} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? CHART_COLORS[i]}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            stackId={stacked ? "stack" : undefined}
            maxBarSize={42}
          >
            {colorByIndex && data.map((_, j) => <Cell key={j} fill={CHART_COLORS[j % CHART_COLORS.length]} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  height = 260,
  money,
  centerLabel,
}: {
  data: { name: string; value: number }[];
  height?: number;
  money?: boolean;
  centerLabel?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const fmt: Formatter = (v) => (money ? formatCompact(v) : String(v));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full sm:w-1/2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v) => fmt(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-ink-900">{fmt(total)}</span>
          {centerLabel && <span className="text-[11px] uppercase tracking-wider text-stone-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-2 sm:w-1/2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="truncate text-ink-700">{d.name}</span>
            </span>
            <span className="font-semibold text-ink-900">
              {fmt(d.value)}
              <span className="ml-1 text-xs font-normal text-stone-400">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Funnel({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1].value : null;
        return (
          <div key={d.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink-800">{d.name}</span>
              <span className="text-ink-900">
                <b>{d.value}</b>
                {prev !== null && prev > 0 && (
                  <span className="ml-2 text-xs text-stone-400">{Math.round((d.value / prev) * 100)}% of previous</span>
                )}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-cream-100">
              <div
                className="h-full rounded-lg bg-brand-gradient transition-all"
                style={{ width: `${(d.value / max) * 100}%`, opacity: 1 - i * 0.12 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
