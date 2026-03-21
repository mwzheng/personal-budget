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
  selectedYears?: string[];
  loading?: boolean;
  error?: string | null;
}

export default function ProgressCharts({
  salaryEntries,
  retirementEntries,
  selectedYears = [],
  loading = false,
  error = null,
}: Props) {
  const theme = useTheme();
  const data = useMemo(() => {
    const selectedYearSet = new Set(selectedYears);

    // Note 2: Filtering before the merge keeps the X-axis stable for both lines.
    // That means a selected year disappears from both salary and retirement at the
    // same time instead of leaving partial rows behind.
    const filteredRetirementEntries =
      selectedYearSet.size === 0
        ? retirementEntries
        : retirementEntries.filter((entry) =>
            selectedYearSet.has(String(entry.year)),
          );
    const filteredSalaryEntries =
      selectedYearSet.size === 0
        ? salaryEntries
        : salaryEntries.filter((entry) =>
            selectedYearSet.has(String(entry.year)),
          );

    // Note 3: Build maps by year first so the merge stays linear instead of
    // repeatedly searching the arrays for matching years.
    const retirementByYear = new Map<number, number>();
    for (const entry of filteredRetirementEntries) {
      retirementByYear.set(entry.year, entry.endAmount);
    }

    const salaryByYear = new Map<number, number>();
    for (const entry of filteredSalaryEntries) {
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
  }, [retirementEntries, salaryEntries, selectedYears]);

  const tooltipContent = ({ active, label, payload }: any) => {
    if (!active || !payload?.length) return null;
    const rows = payload
      .filter(
        (entry: any) =>
          entry && entry.value !== null && entry.value !== undefined,
      )
      .map((entry: any) => {
        const labelText = entry.name ?? entry.dataKey;
        const value =
          typeof entry.value === "number"
            ? `$${Number(entry.value).toLocaleString()}`
            : entry.value;
        return { label: String(labelText), value, color: entry.color };
      });
    return rows.length > 0 ? (
      <ChartTooltipCard
        title={typeof label === "string" ? label : undefined}
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
              {selectedYears.length > 0
                ? "No progress data for the selected years."
                : "Add salary or retirement history to see progress over time."}
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
