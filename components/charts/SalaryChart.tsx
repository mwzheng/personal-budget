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
  type TooltipProps,
} from "recharts";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { formatCurrencyWhole } from "@/lib/utils/format";
import type { SalaryEntry } from "@/lib/types/types";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

type SalaryTooltipProps = TooltipProps<number, string>;
type SalaryTooltipEntry = NonNullable<SalaryTooltipProps["payload"]>[number];

export default function SalaryChart({
  data,
  loading = false,
}: {
  data: SalaryEntry[];
  loading?: boolean;
}) {
  // Note 2: Chart always shows the full salary history (year filter was removed).
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((left, right) => left.year - right.year)
      .map((entry) => ({
        name: String(entry.year),
        amount: entry.amount,
        yoy: entry.yoy ?? 0,
      }));
  }, [data]);

  const tooltipContent = ({ active, label, payload }: SalaryTooltipProps) => {
    if (!active || !payload?.length) return null;
    const rows = payload
      .filter(
        (entry): entry is SalaryTooltipEntry =>
          Boolean(entry) && entry.value !== null && entry.value !== undefined,
      )
      .map((entry) => {
        const labelText =
          entry.dataKey === "amount"
            ? "Salary"
            : entry.dataKey === "yoy"
              ? "YoY"
              : String(entry.dataKey);
        const value =
          entry.dataKey === "yoy"
            ? `${Number(entry.value ?? 0).toFixed(1)}%`
            : formatCurrencyWhole(Number(entry.value ?? 0));
        return { label: labelText, value, color: entry.color };
      });

    return rows.length > 0 ? (
      <ChartTooltipCard
        title={
          label !== undefined && label !== null ? String(label) : undefined
        }
        rows={rows}
      />
    ) : null;
  };

  if (loading) {
    return (
      <Box sx={{ height: "100%" }}>
        <ChartLoadingState height={320} legendItems={2} />
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        <Typography color="text.secondary">
          Add salary history to see the chart.
        </Typography>
      </Box>
    );
  }

  return (
    <ChartWrapper title="Salary History">
      <Box sx={{ width: "100%", height: "100%", minHeight: 320, mx: "auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 40, left: 40, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={SERVER_THEME_TOKENS.chart.grid}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: SERVER_THEME_TOKENS.chart.axis }}
            />
            <YAxis
              yAxisId={0}
              tickFormatter={(value: number) =>
                value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`
              }
              tick={{ fill: SERVER_THEME_TOKENS.chart.axis }}
            />
            <YAxis
              yAxisId={1}
              orientation="right"
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fill: SERVER_THEME_TOKENS.chart.axis }}
            />
            <Tooltip content={tooltipContent} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke={SERVER_THEME_TOKENS.chart.palette[0]}
              strokeWidth={2}
              strokeLinecap="round"
              dot
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            <Line
              type="monotone"
              dataKey="yoy"
              stroke={SERVER_THEME_TOKENS.chart.palette[2]}
              strokeWidth={2}
              strokeLinecap="round"
              dot
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              yAxisId={1}
              animationDuration={1500}
              animationEasing="ease-in-out"
              animationBegin={200}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </ChartWrapper>
  );
}
