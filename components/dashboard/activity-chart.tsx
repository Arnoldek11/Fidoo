"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityPoint } from "@/lib/loyalty/stats";

const METRICS = [
  { value: "visits", label: "Visites" },
  { value: "newCustomers", label: "Nouveaux clients" },
  { value: "rewardsRedeemed", label: "Récompenses" },
] as const;

type MetricKey = (typeof METRICS)[number]["value"];

function formatDay(dateStr: string, style: "short" | "long") {
  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("fr-BE", {
    day: "numeric",
    month: style === "short" ? "short" : "long",
  }).format(date);
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: ActivityPoint; value: number }[];
  metricLabel: string;
};

function ChartTooltip({ active, payload, metricLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const value = payload[0].value;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{formatDay(point.date, "long")}</p>
      <p className="font-semibold text-foreground">
        {value.toLocaleString("fr-BE")} {metricLabel.toLowerCase()}
      </p>
    </div>
  );
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("visits");
  const activeMetric = METRICS.find((m) => m.value === metric)!;

  return (
    <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <CardTitle className="text-base">Activité fidélité</CardTitle>
        <Tabs value={metric} onValueChange={(v) => v && setMetric(v as MetricKey)}>
          <TabsList>
            {METRICS.map((m) => (
              <TabsTrigger key={m.value} value={m.value}>
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-72 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--coral)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--coral)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatDay(d, "short")}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={<ChartTooltip metricLabel={activeMetric.label} />}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="var(--coral)"
              strokeWidth={2}
              fill="url(#activityFill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--coral)", stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
