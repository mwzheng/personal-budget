// Note 1: ProjectionChart renders a smooth line chart showing the projected
// portfolio balance over time. A line chart (vs. a bar chart) is the right
// visual metaphor here because the balance is a continuous, accumulating value.
"use client";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

type ProjectionTooltipValue = number | string | Array<number | string>;

export default function ProjectionChart({
  data,
}: {
  data: { month: number; date: string; balance: number }[];
}) {
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        <Typography color="text.secondary">
          No projection data available.
        </Typography>
      </Box>
    );
  }
  // Note 2: The `date` field is an ISO string (e.g. "2025-03-01T00:00:00.000Z").
  // `toLocaleDateString()` converts it to a short locale-aware format like
  // "3/1/2025". This is display-only -- the underlying data still uses ISO dates
  // for consistent sorting.
  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString(),
    balance: d.balance,
  }));

  const formatDollar = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1000
        ? `$${(v / 1000).toFixed(0)}K`
        : `$${v}`;

  return (
    <ChartWrapper title="Portfolio Projection">
      <Box sx={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={SERVER_THEME_TOKENS.chart.grid}
            />
            {/* Note 3: `minTickGap={20}` prevents overlapping X-axis labels when
                there are many months. Recharts automatically skips tick marks that
                would be closer together than 20px. */}
            <XAxis
              dataKey="name"
              minTickGap={20}
              tick={{ fontSize: 11, fill: SERVER_THEME_TOKENS.chart.axis }}
            />
            <YAxis
              tickFormatter={formatDollar}
              tick={{ fontSize: 11, fill: SERVER_THEME_TOKENS.chart.axis }}
            />
            <Tooltip
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0]?.value as
                  | ProjectionTooltipValue
                  | undefined;
                const normalizedValue = Array.isArray(value) ? value[0] : value;
                return (
                  <ChartTooltipCard
                    title={typeof label === "string" ? label : undefined}
                    rows={[
                      {
                        label: "Balance",
                        value: `$${Number(normalizedValue ?? 0).toLocaleString()}`,
                        color: payload[0]?.color,
                      },
                    ]}
                  />
                );
              }}
            />
            {/* Note 4: `dot={false}` removes the individual data point markers.
                With dozens or hundreds of monthly points the markers would overlap
                and clutter the chart, so showing only the line is cleaner. */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke={SERVER_THEME_TOKENS.chart.palette[0]}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </ChartWrapper>
  );
}
