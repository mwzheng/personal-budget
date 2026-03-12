// Note 1: TagBarChart renders a horizontal bar chart so the tag names on the
// Y-axis are readable even when they are long strings. A vertical bar chart
// (the default orientation) would crowd the labels or require rotation.
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { TagDataPoint } from "@/lib/types";

// Note 2: BAR_COLORS cycles through a palette of 15 distinct colors. Using
// `i % BAR_COLORS.length` prevents an out-of-bounds index when there are more
// tags than colors. This is a modulo wrap-around -- e.g. tag 16 gets color 1.
const BAR_COLORS = [
  "#42a5f5",
  "#66bb6a",
  "#ef5350",
  "#ffa726",
  "#ab47bc",
  "#26c6da",
  "#d4e157",
  "#ff7043",
  "#8d6e63",
  "#78909c",
  "#26a69a",
  "#5c6bc0",
  "#ef9a9a",
  "#ffe082",
  "#a5d6a7",
];

interface Props {
  data: TagDataPoint[];
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function TagBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
        No tag data for selected filters
      </div>
    );
  }

  // Note 3: Chart height grows with the number of tags to ensure every bar has
  // enough vertical space to be readable. `Math.max(300, ...)` sets a minimum
  // height for cases where there are only one or two tags.
  const height = Math.max(300, data.length * 32 + 60);

  return (
    <ResponsiveContainer width="100%" height={height}>
      {/* Note 4: `layout="vertical"` swaps the axes so categories appear on the
          Y-axis and amounts on the X-axis, producing horizontal bars. */}
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 10, right: 80, bottom: 10, left: 120 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#aaa" }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`
          }
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "#ddd" }}
          width={115}
        />
        <Tooltip
          cursor={false}
          content={({ active, label, payload }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const entry = payload[0];
            const title =
              typeof label === "string"
                ? label
                : String(entry.payload?.name ?? "Tag");

            return (
              <ChartTooltipCard
                title={title}
                rows={[
                  {
                    label: "Amount",
                    value: formatCurrency(Number(entry.value ?? 0)),
                    color: entry.color,
                  },
                ]}
              />
            );
          }}
        />
        {/* Note 5: `radius={[0, 4, 4, 0]}` rounds only the right corners of
            each bar (top-right and bottom-right), giving them a polished look
            while keeping the left edge flush with the Y-axis. */}
        <Bar dataKey="value" radius={[0, 4, 4, 0]} activeBar={false}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
