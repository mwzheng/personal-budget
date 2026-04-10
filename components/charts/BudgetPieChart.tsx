/**
 * Note 1: This pie chart shows individual expenses instead of category totals.
 * The page computes the slices ahead of time so the chart can stay focused on
 * rendering, tooltips, and the center summary state (leftover vs overspending).
 */
"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { BudgetPieSlice } from "@/lib/utils/budget-planner";

interface Props {
  data: BudgetPieSlice[];
  monthlyIncome: number;
  leftoverSavings: number;
  overspending: number;
}

export function BudgetPieChart({
  data,
  monthlyIncome,
  leftoverSavings,
  overspending,
}: Props) {
  const theme = useTheme();

  if (!data.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: theme.palette.text.secondary,
          height: 320,
        }}
      >
        Add expense rows to populate the pie chart.
      </div>
    );
  }

  const legendPayload = data.map((entry) => ({
    value: entry.name,
    color: entry.color,
  }));
  const statusLabel =
    overspending > 0
      ? `Over Budget ${formatCurrencyWhole(overspending)}`
      : leftoverSavings > 0
        ? `Leftover ${formatCurrencyWhole(leftoverSavings)}`
        : "Fully Allocated";
  const statusColor =
    overspending > 0
      ? theme.palette.warning.light
      : theme.palette.success.light;

  return (
    <ChartWrapper title="Budget Allocation">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={112}
                innerRadius={72}
                paddingAngle={2}
                labelLine={false}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
                {/* Note 2: The center copy mirrors the page summary in a
                   dark-theme-safe palette so the chart keeps its own readable
                   status context even when the surrounding card background is
                   much darker than the default SVG text color. */}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    const box = viewBox as
                      | { cx?: number; cy?: number }
                      | undefined;
                    const cx = box?.cx ?? 0;
                    const cy = box?.cy ?? 0;

                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 18}
                          textAnchor="middle"
                          fill={theme.palette.text.secondary}
                          fontSize="13"
                          fontWeight="600"
                        >
                          Monthly Income
                        </text>
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          fill={theme.palette.text.primary}
                          fontSize="20"
                          fontWeight="700"
                        >
                          {formatCurrencyWhole(monthlyIncome)}
                        </text>
                        <text
                          x={cx}
                          y={cy + 24}
                          textAnchor="middle"
                          fill={statusColor}
                          fontSize="12"
                          fontWeight="700"
                        >
                          {statusLabel}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const entry = payload[0];
                  const source = entry.payload as BudgetPieSlice | undefined;

                  return (
                    <ChartTooltipCard
                      title={String(source?.name ?? entry.name ?? "Expense")}
                      rows={[
                        {
                          label: "Amount",
                          value: formatCurrencyWhole(Number(entry.value ?? 0)),
                          color: source?.color,
                        },
                        {
                          label: "Category",
                          value: source?.category ?? "Need",
                        },
                        ...(source?.group
                          ? [
                              {
                                label: "Sankey Path",
                                value: source.group,
                              },
                            ]
                          : []),
                      ]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <ChartLegend
          payload={legendPayload}
          gap={2.5}
          justifyContent="center"
        />
      </Box>
    </ChartWrapper>
  );
}
