"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { formatCurrencyWhole } from "@/lib/utils/format";
import type { FireProjectionRow } from "@/lib/types/types";

interface Props {
  rows: FireProjectionRow[];
  fireNumber: number;
  yearsToFire: number | null;
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
  loading = false,
}: Props) {
  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        name: String(r.calendarYear),
        balance: Math.round(r.endBalance),
        balanceReal: Math.round(r.endBalanceReal),
        fireTarget: Math.round(r.fireNumber),
      })),
    [rows],
  );

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <ChartLoadingState height={360} legendItems={3} />
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
    const rows = payload
      .filter((e) => e.value !== null && e.value !== undefined)
      .map((e) => {
        const labelMap: Record<string, string> = {
          balance: "Portfolio (Nominal)",
          balanceReal: "Portfolio (Real)",
          fireTarget: "FIRE Target",
        };
        return {
          label: labelMap[String(e.dataKey)] ?? String(e.dataKey),
          value: formatCurrencyWhole(Number(e.value ?? 0)),
          color: e.color,
        };
      });
    return rows.length > 0 ? (
      <ChartTooltipCard title={String(label)} rows={rows} />
    ) : null;
  };

  return (
    <Box sx={{ width: "100%", height: 360, mx: "auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
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

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3f51b5"
            strokeWidth={2}
            fill="url(#fireBalanceFill)"
            name="Portfolio (Nominal)"
          />
          <Line
            type="monotone"
            dataKey="balanceReal"
            stroke="#66bb6a"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name="Portfolio (Real)"
          />
          <Line
            type="monotone"
            dataKey="fireTarget"
            stroke="#ef5350"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="FIRE Target"
          />

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

          <ReferenceLine
            y={fireNumber}
            stroke="#ef5350"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
