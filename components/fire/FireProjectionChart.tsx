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
import { formatCurrencyWhole } from "@/lib/utils/format";
import type { FireProjectionRow } from "@/lib/types/types";

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
  // Merge historical retirement data + projected data into a unified timeline
  const chartData = useMemo(() => {
    const projectionData = rows.map((r) => ({
      name: String(r.calendarYear),
      balance: Math.round(r.endBalance) as number | null,
      balanceReal: Math.round(r.endBalanceReal) as number | null,
      fireTarget: Math.round(r.fireNumber) as number | null,
      actualBalance: null as number | null,
    }));

    if (retirementHistory.length === 0) return projectionData;

    const projectionStartYear =
      rows.length > 0 ? rows[0].calendarYear : Infinity;

    const historicalData = retirementHistory
      .filter((e) => e.year < projectionStartYear)
      .sort((a, b) => a.year - b.year)
      .map((e) => ({
        name: String(e.year),
        balance: null as number | null,
        balanceReal: null as number | null,
        fireTarget: null as number | null,
        actualBalance: Math.round(e.endAmount),
      }));

    // Connect historical line to the projected line at the transition point
    if (historicalData.length > 0 && projectionData.length > 0) {
      projectionData[0].actualBalance = projectionData[0].balance;
    }

    return [...historicalData, ...projectionData];
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
    const step = 500_000;
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
          balance: "Portfolio (Nominal)",
          balanceReal: "Portfolio (Real)",
          fireTarget: "FIRE Target",
          actualBalance: "Actual Portfolio",
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

  return (
    <Box sx={{ width: "100%", height: 400, mx: "auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 35, right: 30, left: 30, bottom: 5 }}
        >
          <defs>
            <linearGradient id="fireBalanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3f51b5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#aaa" }} minTickGap={30} />
          <YAxis tickFormatter={formatAxis} tick={{ fill: "#aaa" }} />
          <Tooltip content={tooltipContent} />

          {/* $500K milestone reference lines */}
          {milestoneLines.map((m) => (
            <ReferenceLine
              key={`ms-${m}`}
              y={m}
              stroke="#9e9e9e"
              strokeWidth={1}
              strokeDasharray="6 3"
              label={{
                value: formatAxis(m),
                position: "right",
                fill: "#757575",
                fontSize: 11,
                fontWeight: 500,
              }}
            />
          ))}

          {/* Projected portfolio (nominal) — filled area */}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3f51b5"
            strokeWidth={2}
            fill="url(#fireBalanceFill)"
            name="Portfolio (Nominal)"
            connectNulls={false}
          />

          {/* Projected portfolio (inflation-adjusted) — dashed */}
          <Line
            type="monotone"
            dataKey="balanceReal"
            stroke="#66bb6a"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            connectNulls={false}
            name="Portfolio (Real)"
          />

          {/* FIRE target line — dashed red */}
          <Line
            type="monotone"
            dataKey="fireTarget"
            stroke="#ef5350"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls={false}
            name="FIRE Target"
          />

          {/* Actual portfolio history — solid orange */}
          {hasActualData && (
            <Line
              type="monotone"
              dataKey="actualBalance"
              stroke="#ff9800"
              strokeWidth={2.5}
              dot={{ fill: "#ff9800", r: 3, strokeWidth: 0 }}
              connectNulls={false}
              name="Actual Portfolio"
            />
          )}

          {/* Vertical FIRE achievement line */}
          {yearsToFire !== null && (
            <ReferenceLine
              x={String(new Date().getFullYear() + yearsToFire)}
              stroke="#4caf50"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: "🔥 FIRE!",
                position: "top",
                fill: "#4caf50",
                fontWeight: 700,
                fontSize: 13,
              }}
            />
          )}

          {/* Horizontal FIRE number line */}
          <ReferenceLine
            y={fireNumber}
            stroke="#ef5350"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Actual milestone markers (orange dots at $500K crossings) */}
          {actualMilestones.map((ms) => (
            <ReferenceDot
              key={`actual-${ms.amount}`}
              x={String(ms.year)}
              y={ms.amount}
              r={7}
              fill="#ff9800"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: `✓ ${formatAxis(ms.amount)}`,
                position: "top",
                fill: "#e65100",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
