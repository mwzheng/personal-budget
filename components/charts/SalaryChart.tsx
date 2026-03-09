// Note 1: SalaryChart shows the user's annual salary progression as a bar chart.
// Each bar represents one year. The YoY (year-over-year) growth rate is overlaid
// as a secondary data series but note that `Line` on a `BarChart` requires a
// matching `yAxisId` -- this is currently set to `yAxisId={1}` without a
// corresponding secondary `<YAxis>`, which hides the line in practice.
"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from "recharts";

export default function SalaryChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  // Note 2: Sorting by year before rendering ensures bars appear in
  // chronological order regardless of the order DynamoDB returns items.
  // DynamoDB returns items in sort-key order ("salary#2022", "salary#2023", etc.)
  // which is already ascending, but defensive sorting here is still a good habit.
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const chartData = sorted.map((d) => ({
    name: String(d.year),
    amount: d.amount,
    yoy: d.yoy ?? 0,
  }));
  return (
    <div style={{ width: "100%", height: 320, marginBottom: 16 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            // Note 3: The formatter receives `value` as `number | string`.
            // The `typeof value === "number"` guard avoids calling `toLocaleString`
            // on a string, which would produce unexpected output.
            formatter={(value: any) =>
              typeof value === "number"
                ? `$${Number(value).toLocaleString()}`
                : value
            }
            contentStyle={{ background: "#242424", border: "1px solid #444" }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="amount" fill="#4caf50" />
          <Line
            type="monotone"
            dataKey="yoy"
            stroke="#ff9800"
            strokeWidth={2}
            yAxisId={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
