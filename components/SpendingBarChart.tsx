"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { TimeseriesPoint } from "@/lib/types";

function formatMonth(period: string): string {
  try {
    return format(parseISO(`${period}-01`), "MMM yy");
  } catch {
    return period;
  }
}

function formatDollar(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

interface Props {
  data: TimeseriesPoint[];
}

export function SpendingBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "#666", height: 300 }}
      >
        No data for selected filters
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.period) }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#aaa" }}
          angle={-45}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#aaa" }}
          tickFormatter={formatDollar}
        />
        <Tooltip
          formatter={(value: number) => [
            `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            "",
          ]}
          contentStyle={{ background: "#242424", border: "1px solid #444" }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#fff" }}
        />
        <Legend />
        <Bar dataKey="Saving" stackId="a" fill="#66bb6a" name="Saving" />
        <Bar dataKey="Need" stackId="a" fill="#ef5350" name="Need" />
        <Bar dataKey="Want" stackId="a" fill="#42a5f5" name="Want">
          <LabelList
            dataKey="amount"
            position="top"
            formatter={formatDollar}
            style={{ fontSize: 10, fill: "#ccc" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
