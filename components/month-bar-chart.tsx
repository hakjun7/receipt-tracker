"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatKRWCompact, formatKRW } from "@/lib/format";

export type MonthDatum = { month: string; total: number };

export function MonthBarChart({ data }: { data: MonthDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />
        <YAxis
          tickFormatter={(v) => formatKRWCompact(Number(v))}
          tickLine={false}
          axisLine={false}
          width={70}
          className="text-xs"
        />
        <Tooltip
          formatter={(v) => [formatKRW(Number(v) || 0), "지출"]}
          cursor={{ fill: "var(--accent)" }}
          contentStyle={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
