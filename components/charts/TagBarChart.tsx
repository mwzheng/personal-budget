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
import { TAG_CHART_PALETTE } from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";
import { TagDataPoint } from "@/lib/types/types";

interface Props {
  data: TagDataPoint[];
  activeTags?: string[];
  onTagClick?: (tag: string) => void;
}

export function TagBarChart({ data, activeTags = [], onTagClick }: Props) {
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
  const activeTagSet = new Set(activeTags);
  const hasVisibleActiveTags = data.some((entry) =>
    activeTagSet.has(entry.name),
  );

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
          {data.map((entry, i) => {
            const isActive = activeTagSet.has(entry.name);

            return (
              <Cell
                key={`cell-${entry.name}-${i}`}
                fill={TAG_CHART_PALETTE[i % TAG_CHART_PALETTE.length]}
                fillOpacity={hasVisibleActiveTags && !isActive ? 0.45 : 1}
                stroke={isActive ? "#fff" : "none"}
                strokeWidth={isActive ? 2 : 0}
                role={onTagClick ? "button" : undefined}
                tabIndex={onTagClick ? 0 : undefined}
                aria-label={
                  onTagClick
                    ? `Filter transactions by tag ${entry.name}`
                    : undefined
                }
                onClick={onTagClick ? () => onTagClick(entry.name) : undefined}
                onKeyDown={
                  onTagClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onTagClick(entry.name);
                        }
                      }
                    : undefined
                }
                style={{ cursor: onTagClick ? "pointer" : "default" }}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
