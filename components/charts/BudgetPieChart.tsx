/**
 * Note 1: This pie chart shows individual expenses instead of category totals.
 * The page computes the slices ahead of time so the chart can stay focused on
 * rendering, tooltips, and the center summary state (leftover vs overspending).
 */
"use client";

import Box from "@mui/material/Box";
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
import { BudgetPieSlice } from "@/lib/budget-planner";

interface Props {
  data: BudgetPieSlice[];
  monthlyIncome: number;
  leftoverSavings: number;
  overspending: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function BudgetPieChart({
  data,
  monthlyIncome,
  leftoverSavings,
  overspending,
}: Props) {
  if (!data.length) {
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "#666", height: 320 }}
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
      ? `Over by ${formatCurrency(overspending)}`
      : leftoverSavings > 0
        ? `Leftover ${formatCurrency(leftoverSavings)}`
        : "On budget";
  const statusColor = overspending > 0 ? "#ed6c02" : "#2e7d32";

  return (
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
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
              {/* Note 2: The center label anchors the pie back to monthly income.
                  Without this, an overspending plan would render valid expense
                  slices but give no in-chart hint that the total exceeds income. */}
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
                        fill="#6b7280"
                        fontSize="12"
                      >
                        Monthly income
                      </text>
                      <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fill="#111827"
                        fontSize="18"
                        fontWeight="700"
                      >
                        {formatCurrency(monthlyIncome)}
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
                        value: formatCurrency(Number(entry.value ?? 0)),
                        color: source?.color,
                      },
                      {
                        label: "Category",
                        value: source?.category ?? "Need",
                      },
                      ...(source?.group
                        ? [
                            {
                              label: "Group",
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
      <ChartLegend payload={legendPayload} gap={2.5} justifyContent="center" />
    </Box>
  );
}
