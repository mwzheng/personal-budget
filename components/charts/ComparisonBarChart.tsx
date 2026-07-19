"use client";

import Box from "@mui/material/Box";
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
import { format, parseISO } from "date-fns";

import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthSummary } from "@/lib/types/types";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

function formatMonth(period: string): string {
  try {
    return format(parseISO(`${period}-01`), "MMM yyyy");
  } catch {
    return period;
  }
}

function formatDollar(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

interface Props {
  prevMonth: MonthSummary;
  currMonth: MonthSummary;
}

const CATEGORIES = ["Need", "Want", "Saving"] as const;
const MONTH_A_KEY = "prevMonth";
const MONTH_B_KEY = "currMonth";

// Lighter variants for Month B bars to distinguish them from Month A
const MONTH_B_COLORS: Record<string, string> = {
  Need: "#ef9a9a",
  Want: "#90caf9",
  Saving: "#a5d6a7",
};

export function ComparisonBarChart({ prevMonth, currMonth }: Props) {
  const labelA = formatMonth(prevMonth.period);
  const labelB = formatMonth(currMonth.period);

  const chartData = CATEGORIES.map((cat) => ({
    category: cat,
    [MONTH_A_KEY]: prevMonth.totalByCategoryType[cat],
    [MONTH_B_KEY]: currMonth.totalByCategoryType[cat],
  }));

  const hasData = CATEGORIES.some(
    (cat) =>
      prevMonth.totalByCategoryType[cat] > 0 ||
      currMonth.totalByCategoryType[cat] > 0,
  );

  if (!hasData) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 5,
          color: "text.secondary",
          height: 280,
        }}
      >
        No category data for the selected months
      </Box>
    );
  }

  const legendPayload = CATEGORIES.map((cat) => ({
    value: cat,
    color: CATEGORY_HEX_COLORS[cat],
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 20, bottom: 8, left: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={SERVER_THEME_TOKENS.chart.grid}
            />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: SERVER_THEME_TOKENS.chart.axis }}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: SERVER_THEME_TOKENS.chart.axis }}
              tickFormatter={formatDollar}
            />
            <Tooltip
              cursor={false}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null;

                const rows = payload
                  .filter((entry) => Number(entry.value ?? 0) > 0)
                  .map((entry, index) => {
                    const dataKey = String(entry.dataKey ?? index);
                    return {
                      key: `${dataKey}-${String(label ?? "")}-${index}`,
                      label: String(entry.name ?? ""),
                      value: formatCurrency(Number(entry.value ?? 0)),
                      color: entry.color,
                    };
                  });

                return rows.length > 0 ? (
                  <ChartTooltipCard
                    title={typeof label === "string" ? label : undefined}
                    rows={rows}
                  />
                ) : null;
              }}
            />
            <Bar
              dataKey={MONTH_A_KEY}
              name={labelA}
              animationDuration={800}
              animationEasing="ease-out"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`a-${entry.category}`}
                  fill={CATEGORY_HEX_COLORS[entry.category]}
                />
              ))}
            </Bar>
            <Bar
              dataKey={MONTH_B_KEY}
              name={labelB}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={200}
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`b-${entry.category}`}
                  fill={MONTH_B_COLORS[entry.category]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <ChartLegend payload={legendPayload} gap={3} justifyContent="center" />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          fontSize: 12,
          color: "text.secondary",
        }}
      >
        <span>■ Solid = {labelA}</span>
        <span>■ Light = {labelB}</span>
      </Box>
    </Box>
  );
}
