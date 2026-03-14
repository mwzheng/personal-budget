/**
 * Note 1: SalaryChart shows the user's annual salary progression as a line chart.
 * Each point represents one year. The YoY (year-over-year) growth rate is shown as
 * a secondary line mapped to a right-side Y axis.
 */
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
import type { SalaryEntry } from "@/lib/types";

function formatCurrency(value: number) {
  return `$${Number(value).toLocaleString()}`;
}

export default function SalaryChart({
  data,
  selectedYears = [],
}: {
  data: SalaryEntry[];
  selectedYears?: string[];
}) {
  // Note 2: The year filter is chart-only. The list can keep showing the full
  // salary history while the graph focuses on the subset the user selected.
  const chartData = React.useMemo(() => {
    const selectedYearSet = new Set(selectedYears);
    const filtered =
      selectedYearSet.size === 0
        ? data
        : data.filter((entry) => selectedYearSet.has(String(entry.year)));

    return [...filtered]
      .sort((left, right) => left.year - right.year)
      .map((entry) => ({
        name: String(entry.year),
        amount: entry.amount,
        yoy: entry.yoy ?? 0,
      }));
  }, [data, selectedYears]);

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

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: 220,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        <Typography color="text.secondary">
          {selectedYears.length > 0
            ? "No salary data for the selected years."
            : "Add salary history to see the chart."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 320, mb: 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 60, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#aaa" }} />
          <YAxis
            yAxisId={0}
            tickFormatter={(value: number) =>
              value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`
            }
            tick={{ fill: "#aaa" }}
          />
          <YAxis
            yAxisId={1}
            orientation="right"
            tickFormatter={(value: number) => `${value}%`}
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
    </Box>
  );
}
