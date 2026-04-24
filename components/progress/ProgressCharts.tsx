// Note 1: ProgressCharts is now a pure view over parent-owned salary and
// retirement data. Lifting the fetch up keeps refresh behavior explicit and lets
// the same year filter drive multiple charts consistently.
//
// Note 2: Two tabs consolidate chart content in one panel — Retirement Growth
// shows end-of-year retirement totals and Salary Progression delegates to the
// reusable SalaryChart. Only the active tab panel is mounted to avoid Recharts
// stale-size issues inside hidden containers.
"use client";

import React, { useMemo, useState } from "react";
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";
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
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import SalaryChart from "@/components/charts/SalaryChart";
import { SectionHeader } from "@/components/progress/SectionHeader";
import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

interface RetirementChartRow {
  year: string;
  retirement: number | null;
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

const TAB_RETIREMENT = 0;
const TAB_SALARY = 1;

export default function ProgressCharts({
  salaryEntries,
  retirementEntries,
  loading = false,
  error = null,
}: Props) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(TAB_RETIREMENT);

  const retirementData = useMemo(() => {
    return [...retirementEntries]
      .sort((a, b) => a.year - b.year)
      .map(
        (entry): RetirementChartRow => ({
          year: String(entry.year),
          retirement: entry.endAmount,
        }),
      );
  }, [retirementEntries]);

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

      <Tabs
        value={activeTab}
        onChange={(_, newValue: number) => setActiveTab(newValue)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label="Retirement Growth"
          id="chart-tab-0"
          aria-controls="chart-panel-0"
        />
        <Tab
          label="Salary Progression"
          id="chart-tab-1"
          aria-controls="chart-panel-1"
        />
      </Tabs>

      {/* Retirement Growth panel */}
      {activeTab === TAB_RETIREMENT && (
        <Box
          role="tabpanel"
          id="chart-panel-0"
          aria-labelledby="chart-tab-0"
          sx={{ width: "100%", height: 320 }}
        >
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
          ) : retirementData.length === 0 ? (
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
                Add retirement history to see growth over time.
              </Typography>
            </Box>
          ) : (
            <ChartWrapper title="Retirement Growth">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retirementData}>
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
                    strokeLinecap="round"
                    dot
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          )}
        </Box>
      )}

      {/* Salary Progression panel — delegates to reusable SalaryChart */}
      {activeTab === TAB_SALARY && (
        <Box role="tabpanel" id="chart-panel-1" aria-labelledby="chart-tab-1">
          <SalaryChart data={salaryEntries} loading={loading} />
        </Box>
      )}
    </Box>
  );
}
