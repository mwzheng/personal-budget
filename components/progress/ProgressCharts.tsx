// Note 1: ProgressCharts is now a pure view over parent-owned salary and
// retirement data. Lifting the fetch up keeps refresh behavior explicit and lets
// the same year filter drive multiple charts consistently.
//
// Note 2: Two tabs consolidate chart content in one panel — Retirement Growth
// shows end-of-year retirement totals and Salary Progression delegates to the
// reusable SalaryChart. Only the active tab panel is mounted to avoid Recharts
// stale-size issues inside hidden containers.
//
// Note 3: Milestone markers can optionally be rendered on the retirement chart
// when the milestones prop is provided. Each marker appears as a small diamond
// on the data line at the year the milestone amount is closest to.
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
  ReferenceLine,
  ReferenceDot,
  type TooltipProps,
} from "recharts";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import SalaryChart from "@/components/charts/SalaryChart";
import type {
  MilestoneEntry,
  RetirementEntry,
  SalaryEntry,
} from "@/lib/types/types";

interface RetirementChartRow {
  year: string;
  retirement: number | null;
}

interface Props {
  salaryEntries: SalaryEntry[];
  retirementEntries: RetirementEntry[];
  loading?: boolean;
  error?: string | null;
  /** When set, draws a dashed reference line on the retirement chart so the
   *  user can see how far current savings are from the goal. */
  goalTargetAmount?: number | null;
  /** Optional milestones to render as diamond markers on the retirement chart. */
  milestones?: MilestoneEntry[];
}

type ProgressTooltipProps = TooltipProps<number, string>;
type ProgressTooltipEntry = NonNullable<
  ProgressTooltipProps["payload"]
>[number];

const TAB_RETIREMENT = 0;
const TAB_SALARY = 1;
const CHART_HEIGHT = 400;

/** Map milestones to chart data points. For each milestone, find the retirement
 *  entry with the closest endAmount and use that year's data point so the marker
 *  sits on the line. */
function buildMilestoneMarkers(
  milestones: MilestoneEntry[],
  retirementData: RetirementChartRow[],
): { year: string; retirement: number }[] {
  if (milestones.length === 0 || retirementData.length === 0) return [];
  // Filter to rows with non-null retirement values for comparison.
  const validRows = retirementData.filter(
    (r): r is RetirementChartRow & { retirement: number } =>
      r.retirement !== null,
  );
  if (validRows.length === 0) return [];
  return milestones
    .filter((m) => m.amount > 0)
    .map((m) => {
      let closest = validRows[0];
      let minDiff = Math.abs(closest.retirement - m.amount);
      for (const row of validRows) {
        const diff = Math.abs(row.retirement - m.amount);
        if (diff < minDiff) {
          closest = row;
          minDiff = diff;
        }
      }
      return { year: closest.year, retirement: m.amount };
    });
}

export default function ProgressCharts({
  salaryEntries,
  retirementEntries,
  loading = false,
  error = null,
  goalTargetAmount = null,
  milestones = [],
}: Props) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(TAB_RETIREMENT);

  // Note 3: Compact Y-axis labels keep tick text short on small viewports.
  // Recharts passes the raw numeric value; we convert to $K or $M notation.
  const formatYAxis = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  };

  const retirementData = useMemo(() => {
    return [...retirementEntries]
      .sort((a, b) => a.year - b.year)
      .map((entry): RetirementChartRow => ({
        year: String(entry.year),
        retirement: entry.endAmount,
      }));
  }, [retirementEntries]);

  const milestoneMarkers = useMemo(
    () => buildMilestoneMarkers(milestones, retirementData),
    [milestones, retirementData],
  );

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
          sx={{ width: "100%", height: CHART_HEIGHT }}
        >
          {loading ? (
            <ChartLoadingState height={CHART_HEIGHT} showLegend={false} />
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
                  <YAxis
                    type="number"
                    tickFormatter={formatYAxis}
                    domain={[
                      0,
                      (dataMax: number) =>
                        Math.ceil(
                          Math.max(dataMax, goalTargetAmount ?? dataMax) * 1.1,
                        ),
                    ]}
                    width={60}
                  />
                  <Tooltip content={tooltipContent} />
                  <Legend />
                  {goalTargetAmount != null && (
                    <ReferenceLine
                      y={goalTargetAmount}
                      stroke={theme.palette.success.main}
                      strokeDasharray="6 3"
                      label={{
                        value: "Goal",
                        position: "insideTopRight",
                        fill: theme.palette.success.main,
                        fontSize: 12,
                      }}
                    />
                  )}
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
                  {/* Milestone markers — small diamonds on the line */}
                  {milestoneMarkers.map((marker) => (
                    <ReferenceDot
                      key={`milestone-${marker.year}-${marker.retirement}`}
                      x={marker.year}
                      y={marker.retirement}
                      r={5}
                      fill={theme.palette.secondary.main}
                      stroke={theme.palette.background.paper}
                      strokeWidth={2}
                      isFront
                    />
                  ))}
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
