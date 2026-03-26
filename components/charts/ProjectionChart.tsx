// Note 1: ProjectionChart renders a smooth line chart showing the projected
// portfolio balance over time. A line chart (vs. a bar chart) is the right
// visual metaphor here because the balance is a continuous, accumulating value.
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

type ProjectionTooltipValue = number | string | Array<number | string>;

export default function ProjectionChart({
  data,
}: {
  data: { month: number; date: string; balance: number }[];
}) {
  if (!data || data.length === 0) return null;
  // Note 2: The `date` field is an ISO string (e.g. "2025-03-01T00:00:00.000Z").
  // `toLocaleDateString()` converts it to a short locale-aware format like
  // "3/1/2025". This is display-only -- the underlying data still uses ISO dates
  // for consistent sorting.
  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString(),
    balance: d.balance,
  }));
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {/* Note 3: `minTickGap={20}` prevents overlapping X-axis labels when
              there are many months. Recharts automatically skips tick marks that
              would be closer together than 20px. */}
          <XAxis dataKey="name" minTickGap={20} />
          <YAxis />
          <Tooltip
            formatter={(value: ProjectionTooltipValue) => {
              const normalizedValue = Array.isArray(value) ? value[0] : value;
              return `$${Number(normalizedValue).toLocaleString()}`;
            }}
            contentStyle={{ background: "#242424", border: "1px solid #444" }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          {/* Note 4: `dot={false}` removes the individual data point markers.
              With dozens or hundreds of monthly points the markers would overlap
              and clutter the chart, so showing only the line is cleaner. */}
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#3f51b5"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
