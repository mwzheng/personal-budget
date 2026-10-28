// Note 1: SpendingBarChart compares monthly income with a stacked total of needs,
// wants, and savings so users can see how their income was allocated.
"use client";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MuiTooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useChartTheme } from "@/lib/theme/use-chart-theme";

import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltipCard } from "@/components/charts/ChartTooltipCard";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import { formatCurrency } from "@/lib/utils/format";
import { TimeseriesPoint } from "@/lib/types/types";

// Note 2: `formatMonth` converts the "YYYY-MM" period string into a short
// label like "Jan 24". Appending "-01" converts the partial date to a full ISO
// date that `parseISO` can handle, because `parseISO("2024-01")` would fail.
function formatMonth(period: string): string {
  try {
    return format(parseISO(`${period}-01`), "MMM yy");
  } catch {
    return period;
  }
}

// Note 3: `formatDollar` shortens large values to a K-notation (e.g. $1.5K).
// This keeps Y-axis labels from overlapping on smaller screens while still
// conveying the order of magnitude.
function formatDollar(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

type ChartLabelPositionProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
};
const EMPTY_SVG_LABEL = <g />;

function renderBarTotalLabel(
  props: ChartLabelPositionProps,
  totalAmount: number,
  angle: number,
  fontSize: number,
): JSX.Element | null {
  if (totalAmount <= 0) {
    return null;
  }

  const x = Number(props.x ?? 0) + Number(props.width ?? 0) / 2;
  const y = Number(props.y ?? 0) - 8;

  return (
    <text
      x={x}
      y={y}
      fill="var(--pb-text-primary)"
      fontSize={fontSize}
      fontWeight={500}
      textAnchor="middle"
      transform={angle === 0 ? undefined : `rotate(${angle} ${x} ${y})`}
    >
      {formatDollar(totalAmount)}
    </text>
  );
}

interface Props {
  data: TimeseriesPoint[];
}

export function SpendingBarChart({ data }: Props) {
  const SERVER_THEME_TOKENS = useChartTheme();
  const [expanded, setExpanded] = useState(false);
  if (data.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 5,
          px: 2,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        No data for selected filters
      </Box>
    );
  }

  // Note 4: Adding a `label` field derived from `period` keeps the data array
  // pure ("YYYY-MM" strings for logic) while providing a display-friendly
  // string for the XAxis without mutating the original objects.
  const chartData = data.map((entry) => ({
    ...entry,
    label: formatMonth(entry.period),
  }));
  const labelAngle =
    chartData.length > 14 ? -55 : chartData.length > 8 ? -35 : 0;
  const labelFontSize =
    chartData.length > 14 ? 11 : chartData.length > 8 ? 12 : 14;
  const chartTopMargin = labelAngle === 0 ? 24 : 40;
  const legendPayload = [
    { value: "Needs", color: CATEGORY_HEX_COLORS.Need },
    { value: "Wants", color: CATEGORY_HEX_COLORS.Want },
    { value: "Savings", color: CATEGORY_HEX_COLORS.Saving },
    { value: "Income", color: SERVER_THEME_TOKENS.chart.palette[4] }, // cyan
  ] as const;

  const renderChart = (large: boolean) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          width: "100%",
          height: large
            ? { xs: "min(55vh, 420px)", sm: "min(70vh, 720px)" }
            : 420,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: chartTopMargin, right: 20, bottom: 25, left: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={SERVER_THEME_TOKENS.chart.grid}
            />
            {/* Note 5: `angle={-45}` rotates X-axis labels 45 degrees to prevent
                  overlapping when there are many months. `textAnchor="end"` aligns
                  the rotated text so its end point sits at the tick mark. */}
            <XAxis
              dataKey="label"
              tick={{
                fontSize: 14,
                fontWeight: 500,
                fill: "var(--pb-text-primary)",
              }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{
                fontSize: 14,
                fontWeight: 500,
                fill: "var(--pb-text-primary)",
              }}
              tickFormatter={formatDollar}
            />
            <Tooltip
              cursor={false}
              shared={false}
              content={({ active, label, payload }) => {
                const hovered = payload?.[0];
                const month = hovered?.payload as
                  (TimeseriesPoint & { label: string }) | undefined;
                if (!active || !hovered || !month) {
                  return null;
                }

                const incomeOnly = hovered.dataKey === "incomeAmount";
                const rows = [
                  ...(!incomeOnly
                    ? [
                        {
                          label: "Needs",
                          value: formatCurrency(month.Need),
                          color: CATEGORY_HEX_COLORS.Need,
                        },
                        {
                          label: "Wants",
                          value: formatCurrency(month.Want),
                          color: CATEGORY_HEX_COLORS.Want,
                        },
                        {
                          label: "Savings",
                          value: formatCurrency(month.Saving),
                          color: CATEGORY_HEX_COLORS.Saving,
                        },
                      ]
                    : []),
                  {
                    label: "Income",
                    value: formatCurrency(month.incomeAmount),
                    color: SERVER_THEME_TOKENS.chart.palette[4],
                  },
                ];
                const allocationsAmount =
                  month.Need + month.Want + month.Saving;
                const difference =
                  Math.round((month.incomeAmount - allocationsAmount) * 100) /
                  100;
                const summary =
                  difference > 0
                    ? `Underspent: ${formatCurrency(difference)}`
                    : difference < 0
                      ? `Overspent: ${formatCurrency(Math.abs(difference))}`
                      : "Fully Spent";

                return (
                  <ChartTooltipCard
                    title={
                      month.label ||
                      (typeof label === "string" ? label : undefined)
                    }
                    rows={rows}
                    summary={incomeOnly ? undefined : summary}
                  />
                );
              }}
            />
            <Bar
              dataKey="Need"
              stackId="allocations"
              fill={CATEGORY_HEX_COLORS.Need}
              name="Needs"
              animationDuration={1200}
              animationEasing="ease-out"
              label={(props: ChartLabelPositionProps & { index?: number }) => {
                const entry =
                  typeof props.index === "number"
                    ? chartData[props.index]
                    : undefined;
                if (!entry || entry.Want > 0 || entry.Saving > 0) {
                  return EMPTY_SVG_LABEL;
                }

                return (
                  renderBarTotalLabel(
                    props,
                    entry.Need + entry.Want + entry.Saving,
                    labelAngle,
                    labelFontSize,
                  ) ?? EMPTY_SVG_LABEL
                );
              }}
            />
            <Bar
              dataKey="Want"
              stackId="allocations"
              fill={CATEGORY_HEX_COLORS.Want}
              name="Wants"
              animationDuration={1200}
              animationEasing="ease-out"
              label={(props: ChartLabelPositionProps & { index?: number }) => {
                const entry =
                  typeof props.index === "number"
                    ? chartData[props.index]
                    : undefined;
                if (!entry || entry.Want <= 0 || entry.Saving > 0) {
                  return EMPTY_SVG_LABEL;
                }

                return (
                  renderBarTotalLabel(
                    props,
                    entry.Need + entry.Want + entry.Saving,
                    labelAngle,
                    labelFontSize,
                  ) ?? EMPTY_SVG_LABEL
                );
              }}
            />
            <Bar
              dataKey="Saving"
              stackId="allocations"
              fill={CATEGORY_HEX_COLORS.Saving}
              name="Savings"
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={300}
              radius={[4, 4, 0, 0]}
              label={(props: ChartLabelPositionProps & { index?: number }) => {
                const entry =
                  typeof props.index === "number"
                    ? chartData[props.index]
                    : undefined;
                if (!entry || entry.Saving <= 0) {
                  return EMPTY_SVG_LABEL;
                }

                return (
                  renderBarTotalLabel(
                    props,
                    entry.Need + entry.Want + entry.Saving,
                    labelAngle,
                    labelFontSize,
                  ) ?? EMPTY_SVG_LABEL
                );
              }}
            />
            <Bar
              dataKey="incomeAmount"
              fill={SERVER_THEME_TOKENS.chart.palette[4]}
              name="Income"
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={150}
              radius={[4, 4, 0, 0]}
              label={(props: ChartLabelPositionProps & { index?: number }) => {
                const entry =
                  typeof props.index === "number"
                    ? chartData[props.index]
                    : undefined;
                if (!entry) {
                  return EMPTY_SVG_LABEL;
                }

                return (
                  renderBarTotalLabel(
                    props,
                    entry.incomeAmount,
                    labelAngle,
                    labelFontSize,
                  ) ?? EMPTY_SVG_LABEL
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {/* Note 7: Moving the legend under the chart keeps the bar area visually
            contiguous. That makes month-to-month comparisons easier before the eye
            moves down to decode the category colors. */}
      <ChartLegend payload={legendPayload} gap={2} justifyContent="center" />
    </Box>
  );

  return (
    <Box sx={{ position: "relative" }}>
      <ChartWrapper title="Monthly Allocations vs Income">
        {renderChart(false)}
      </ChartWrapper>
      <MuiTooltip title="Expand chart">
        <IconButton
          size="small"
          aria-label="Expand Monthly Overview chart"
          onClick={() => setExpanded(true)}
          sx={{
            position: "absolute",
            top: 4,
            right: 40,
            bgcolor: "background.paper",
            color: "text.secondary",
          }}
        >
          <OpenInFullIcon fontSize="small" />
        </IconButton>
      </MuiTooltip>
      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth="xl"
        fullWidth
        aria-labelledby="monthly-overview-dialog-title"
      >
        <DialogTitle id="monthly-overview-dialog-title" sx={{ pr: 7 }}>
          Monthly Overview
          <IconButton
            aria-label="Close expanded chart"
            onClick={() => setExpanded(false)}
            sx={{ position: "absolute", right: 16, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>{renderChart(true)}</DialogContent>
      </Dialog>
    </Box>
  );
}
