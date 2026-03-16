// Note 1: SpendingBarChart renders a stacked bar chart where each bar represents
// one calendar month. The three stacked segments correspond to Need, Want, and
// Saving categories. Stacking lets the viewer compare both the total per month
// and the composition within each month in a single glance.
"use client";

import Box from "@mui/material/Box";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { TimeseriesPoint } from "@/lib/types/types";

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

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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
  const chartData = data.map((entry) => ({
    ...entry,
    label: formatMonth(entry.period),
  }));
  const legendPayload = [
    { value: "Need", color: "#ef5350" },
    { value: "Want", color: "#42a5f5" },
    { value: "Saving", color: "#66bb6a" },
  ] as const;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 24, right: 20, bottom: 60, left: 20 }}
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
              cursor={false}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const rows = payload
                  .filter((entry) => Number(entry.value ?? 0) > 0)
                  .map((entry) => ({
                    label: String(entry.name ?? entry.dataKey ?? "Amount"),
                    value: formatCurrency(Number(entry.value ?? 0)),
                    color: entry.color,
                  }));

                return rows.length > 0 ? (
                  <ChartTooltipCard
                    title={typeof label === "string" ? label : undefined}
                    rows={rows}
                  />
                ) : null;
              }}
            />
            {/* Note 6: `stackId="a"` groups all three Bar components into one
                stacked series. All bars with the same stackId are stacked on top of
                each other per data point. The order of Bar elements determines the
                visual stacking order (bottom to top). */}
            <Bar
              dataKey="Saving"
              stackId="a"
              fill="#66bb6a"
              name="Saving"
              activeBar={false}
            />
            <Bar
              dataKey="Need"
              stackId="a"
              fill="#ef5350"
              name="Need"
              activeBar={false}
            />
            <Bar
              dataKey="Want"
              stackId="a"
              fill="#42a5f5"
              name="Want"
              activeBar={false}
            >
              <LabelList
                dataKey="amount"
                position="top"
                formatter={formatDollar}
                style={{ fontSize: 10, fill: "#ccc" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {/* Note 7: Moving the legend under the chart keeps the bar area visually
          contiguous. That makes month-to-month comparisons easier before the eye
          moves down to decode the category colors. */}
      <ChartLegend
        payload={legendPayload}
        gap={3}
        justifyContent="flex-start"
      />
    </Box>
  );
}
