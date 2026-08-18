"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  type TooltipProps,
} from "recharts";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { formatCurrencyWhole } from "@/lib/utils/format";
import type { FireProjectionRow } from "@/lib/types/types";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

export const FIRE_CHART_LABELS = {
  projectedNominal: "Projected",
  projectedReal: "Today’s $",
  fireTarget: "Target",
  actualBalance: "Actual",
  actualMilestone: "Milestone",
} as const;

export interface ActualMilestone {
  year: number;
  amount: number;
}

interface Props {
  rows: FireProjectionRow[];
  fireNumber: number;
  yearsToFire: number | null;
  retirementHistory?: Array<{ year: number; endAmount: number }>;
  actualMilestones?: ActualMilestone[];
  loading?: boolean;
}

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

type ProjectionTooltipProps = TooltipProps<number, string>;

export default function FireProjectionChart({
  rows,
  fireNumber,
  yearsToFire,
  retirementHistory = [],
  actualMilestones = [],
  loading = false,
}: Props) {
  // Merge projections and recorded yearly balances into one chart timeline.
  const chartData = useMemo(() => {
    const rowsByYear = new Map<
      number,
      {
        name: string;
        balance: number | null;
        balanceReal: number | null;
        fireTarget: number | null;
        actualBalance: number | null;
      }
    >();

    for (const row of rows) {
      rowsByYear.set(row.calendarYear, {
        name: String(row.calendarYear),
        balance: Math.round(row.endBalance),
        balanceReal: Math.round(row.endBalanceReal),
        fireTarget: Math.round(row.fireNumber),
        actualBalance: null,
      });
    }

    for (const entry of retirementHistory) {
      const existing = rowsByYear.get(entry.year) ?? {
        name: String(entry.year),
        balance: null,
        balanceReal: null,
        fireTarget: null,
        actualBalance: null,
      };

      rowsByYear.set(entry.year, {
        ...existing,
        actualBalance: Math.round(entry.endAmount),
      });
    }

    return [...rowsByYear.entries()]
      .sort(([leftYear], [rightYear]) => leftYear - rightYear)
      .map(([, value]) => value);
  }, [rows, retirementHistory]);

  const milestoneLines = useMemo(() => {
    if (chartData.length === 0) return [];
    const allValues = chartData.flatMap((d) =>
      [d.balance, d.balanceReal, d.fireTarget, d.actualBalance].filter(
        (v): v is number => v != null,
      ),
    );
    if (allValues.length === 0) return [];
    const maxVal = Math.max(...allValues);
    const step = 1_000_000;
    const lines: number[] = [];
    for (let m = step; m <= maxVal; m += step) {
      lines.push(m);
    }
    return lines;
  }, [chartData]);

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <ChartLoadingState height={400} legendItems={3} />
      </Box>
    );
  }

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
        }}
      >
        <Typography color="text.secondary">
          Enter your scenario details to see projections.
        </Typography>
      </Box>
    );
  }

  const tooltipContent = ({
    active,
    label,
    payload,
  }: ProjectionTooltipProps) => {
    if (!active || !payload?.length) return null;
    const tooltipRows = payload
      .filter((e) => e.value !== null && e.value !== undefined)
      .map((e) => {
        const labelMap: Record<string, string> = {
          balance: FIRE_CHART_LABELS.projectedNominal,
          balanceReal: FIRE_CHART_LABELS.projectedReal,
          fireTarget: FIRE_CHART_LABELS.fireTarget,
          actualBalance: FIRE_CHART_LABELS.actualBalance,
        };
        return {
          label: labelMap[String(e.dataKey)] ?? String(e.dataKey),
          value: formatCurrencyWhole(Number(e.value ?? 0)),
          color: e.color,
        };
      });
    return tooltipRows.length > 0 ? (
      <ChartTooltipCard title={String(label)} rows={tooltipRows} />
    ) : null;
  };

  const hasActualData = retirementHistory.length > 0;
  const fireAchievementYear =
    yearsToFire != null
      ? rows.findLast((row) => row.year === yearsToFire)?.calendarYear
      : null;

  return (
    <ChartWrapper title="Portfolio Projection">
      <Box sx={{ width: "100%", height: 400, mx: "auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 35, right: 30, left: 30, bottom: 5 }}
          >
            <defs>
              <linearGradient id="fireBalanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={SERVER_THEME_TOKENS.chart.palette[0]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={SERVER_THEME_TOKENS.chart.palette[0]}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={SERVER_THEME_TOKENS.chart.grid}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: SERVER_THEME_TOKENS.chart.axis }}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={formatAxis}
              tick={{ fill: SERVER_THEME_TOKENS.chart.axis }}
            />
            <Tooltip content={tooltipContent} />

            {/* $1M milestone reference lines */}
            {milestoneLines.map((m) => (
              <ReferenceLine
                key={`ms-${m}`}
                y={m}
                stroke={SERVER_THEME_TOKENS.chart.grid}
                strokeWidth={0.75}
                strokeDasharray="8 4"
                label={{
                  value: formatAxis(m),
                  position: "right",
                  fill: SERVER_THEME_TOKENS.chart.axis,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            ))}

            {/* Projected portfolio (nominal) — filled area */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke={SERVER_THEME_TOKENS.chart.palette[0]}
              strokeWidth={2}
              strokeLinecap="round"
              fill="url(#fireBalanceFill)"
              name={FIRE_CHART_LABELS.projectedNominal}
              connectNulls={false}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />

            {/* Projected portfolio in today's dollars — dashed */}
            <Line
              type="monotone"
              dataKey="balanceReal"
              stroke="#66bb6a"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="6 3"
              dot={false}
              connectNulls={false}
              name={FIRE_CHART_LABELS.projectedReal}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={1500}
              animationEasing="ease-in-out"
              animationBegin={200}
            />

            {/* FIRE target line in future dollars — dashed red */}
            {fireNumber > 0 && (
              <Line
                type="monotone"
                dataKey="fireTarget"
                stroke="#ef5350"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="4 4"
                dot={false}
                connectNulls={false}
                name={FIRE_CHART_LABELS.fireTarget}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={400}
              />
            )}

            {/* Actual recorded balances — solid orange */}
            {hasActualData && (
              <Line
                type="monotone"
                dataKey="actualBalance"
                stroke="#ff9800"
                strokeWidth={2.5}
                strokeLinecap="round"
                dot={{ fill: "#ff9800", r: 3, strokeWidth: 0 }}
                connectNulls={false}
                name={FIRE_CHART_LABELS.actualBalance}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            )}

            {/* Vertical FIRE achievement line */}
            {fireAchievementYear != null && (
              <ReferenceLine
                x={String(fireAchievementYear)}
                stroke="#4caf50"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: "🔥 FIRE!",
                  position: "top",
                  fill: "#4caf50",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              />
            )}

            {/* Horizontal FIRE number line */}
            {fireNumber > 0 && (
              <ReferenceLine
                y={fireNumber}
                stroke="#ef5350"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            )}

            {/* Actual milestone markers (dots at $1M crossings) */}
            {actualMilestones.map((ms) => (
              <ReferenceDot
                key={`actual-${ms.amount}`}
                x={String(ms.year)}
                y={ms.amount}
                r={8}
                fill="#ff9800"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: `${formatAxis(ms.amount)} ✓`,
                  position: "top",
                  fill: "#e65100",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </ChartWrapper>
  );
}
