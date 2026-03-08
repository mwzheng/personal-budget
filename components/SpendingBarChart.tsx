// Note 1: SpendingBarChart renders a stacked bar chart where each bar represents
// one calendar month. The three stacked segments correspond to Need, Want, and
// Saving categories. Stacking lets the viewer compare both the total per month
// and the composition within each month in a single glance.
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

// Note 2: `formatMonth` converts the "YYYY-MM" period string into a short
// label like "Jan 24". Appending "-01" converts the partial date to a full ISO
// date that `parseISO` can handle, because `parseISO("2024-01")` would fail.
function formatMonth(period: string): string {
  try {
    return format(parseISO(`${period}-01`), "MMM yy");
  } catch {
    return period;
  }
}

// Note 3: `formatDollar` shortens large values to a K-notation (e.g. $1.5K).
// This keeps Y-axis labels from overlapping on smaller screens while still
// conveying the order of magnitude.
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

  // Note 4: Adding a `label` field derived from `period` keeps the data array
  // pure ("YYYY-MM" strings for logic) while providing a display-friendly
  // string for the XAxis without mutating the original objects.
  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.period) }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        {/* Note 5: `angle={-45}` rotates X-axis labels 45 degrees to prevent
            overlapping when there are many months. `textAnchor="end"` aligns
            the rotated text so its end point sits at the tick mark. */}
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
        {/* Note 6: `stackId="a"` groups all three Bar components into one
            stacked series. All bars with the same stackId are stacked on top of
            each other per data point. The order of Bar elements determines the
            visual stacking order (bottom to top). */}
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
