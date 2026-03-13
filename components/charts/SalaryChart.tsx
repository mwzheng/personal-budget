/**
 * Note 1: SalaryChart shows the user's annual salary progression as a line chart.
 * Each point represents one year. The YoY (year-over-year) growth rate is shown as
 * a secondary line mapped to a right-side Y axis.
 */
"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";

function formatCurrency(value: number) {
  return `$${Number(value).toLocaleString()}`;
}

export default function SalaryChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const chartData = sorted.map((d) => ({
    name: String(d.year),
    amount: d.amount,
    yoy: d.yoy ?? 0,
  }));

  const tooltipContent = ({ active, label, payload }: any) => {
    if (!active || !payload?.length) return null;
    const rows = payload
      .filter(
        (entry: any) =>
          entry && entry.value !== null && entry.value !== undefined,
      )
      .map((entry: any) => {
        const labelText =
          entry.dataKey === "amount"
            ? "Salary"
            : entry.dataKey === "yoy"
              ? "YoY"
              : String(entry.dataKey);
        const value =
          entry.dataKey === "yoy"
            ? `${Number(entry.value ?? 0).toFixed(1)}%`
            : formatCurrency(Number(entry.value ?? 0));
        return { label: labelText, value, color: entry.color };
      });

    return rows.length > 0 ? (
      <ChartTooltipCard
        title={typeof label === "string" ? label : undefined}
        rows={rows}
      />
    ) : null;
  };

  return (
    <div style={{ width: "100%", height: 320, marginBottom: 16 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 60, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#aaa" }} />
          <YAxis
            yAxisId={0}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`
            }
            tick={{ fill: "#aaa" }}
          />
          <YAxis
            yAxisId={1}
            orientation="right"
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: "#aaa" }}
          />
          <Tooltip content={tooltipContent} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#4caf50"
            strokeWidth={2}
            dot
          />
          <Line
            type="monotone"
            dataKey="yoy"
            stroke="#ff9800"
            strokeWidth={2}
            dot
            yAxisId={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
