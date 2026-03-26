// Note 1: ProgressCharts is now a pure view over parent-owned salary and
// retirement data. Lifting the fetch up keeps refresh behavior explicit and lets
// the same year filter drive multiple charts consistently.
"use client";

import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { SectionHeader } from "@/components/progress/SectionHeader";
import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

interface ProgressChartRow {
  year: string;
  retirement: number | null;
  salary: number | null;
}

interface Props {
  salaryEntries: SalaryEntry[];
  retirementEntries: RetirementEntry[];
  loading?: boolean;
  error?: string | null;
}

type ProgressTooltipProps = TooltipProps<number, string>;
type ProgressTooltipEntry = NonNullable<
  ProgressTooltipProps["payload"]
>[number];

export default function ProgressCharts({
  salaryEntries,
  retirementEntries,
  loading = false,
  error = null,
}: Props) {
  const theme = useTheme();
  const data = useMemo(() => {
    // Note 2: Build maps by year first so the merge stays linear instead of
    // repeatedly searching the arrays for matching years.
    const retirementByYear = new Map<number, number>();
    for (const entry of retirementEntries) {
      retirementByYear.set(entry.year, entry.endAmount);
    }

    const salaryByYear = new Map<number, number>();
    for (const entry of salaryEntries) {
      salaryByYear.set(entry.year, entry.amount);
    }

    const years = Array.from(
      new Set([...retirementByYear.keys(), ...salaryByYear.keys()]),
    ).sort((left, right) => left - right);

    return years.map(
      (year): ProgressChartRow => ({
        year: String(year),
        retirement: retirementByYear.get(year) ?? null,
        salary: salaryByYear.get(year) ?? null,
      }),
    );
  }, [retirementEntries, salaryEntries]);

  const tooltipContent = ({ active, label, payload }: ProgressTooltipProps) => {
    if (!active || !payload?.length) return null;
    const rows = payload
      .filter(
        (entry): entry is ProgressTooltipEntry =>
          Boolean(entry) && entry.value !== null && entry.value !== undefined,
      )
      .map((entry) => {
        const labelText = entry.name ?? entry.dataKey;
        const value =
          typeof entry.value === "number"
            ? `$${Number(entry.value).toLocaleString()}`
            : String(entry.value ?? "");
        return { label: String(labelText), value, color: entry.color };
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

  return (
    <Box>
      <SectionHeader title="Progress Over Time" sx={{ mb: 2 }} />

      <Box sx={{ width: "100%", height: 320 }}>
        {loading ? (
          <ChartLoadingState height={320} showLegend={false} />
        ) : error ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 2,
            }}
          >
            <Typography color="error.main">{error}</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 2,
            }}
          >
            <Typography color="text.secondary">
              Add salary or retirement history to see progress over time.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip content={tooltipContent} />
              <Legend />
              <Line
                type="monotone"
                dataKey="retirement"
                name="Retirement End"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot
              />
              <Line
                type="monotone"
                dataKey="salary"
                name="Salary"
                stroke={theme.palette.success.main}
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
}
