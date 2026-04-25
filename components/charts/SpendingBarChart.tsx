// Note 1: SpendingBarChart keeps income and savings as separate monthly bars
// while splitting spending into stacked Need and Want segments. That preserves a
// simple high-level comparison and still shows what the spending is made of.
"use client";

import Box from "@mui/material/Box";
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
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

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
      fill={SERVER_THEME_TOKENS.chart.axis}
      fontSize={fontSize}
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
    chartData.length > 14 ? 8 : chartData.length > 8 ? 9 : 10;
  const chartTopMargin = labelAngle === 0 ? 24 : 40;
  const legendPayload = [
    { value: "Needs", color: CATEGORY_HEX_COLORS.Need },
    { value: "Wants", color: CATEGORY_HEX_COLORS.Want },
    { value: "Income", color: SERVER_THEME_TOKENS.chart.palette[4] }, // cyan
    { value: "Savings", color: CATEGORY_HEX_COLORS.Saving },
  ] as const;

  return (
    <ChartWrapper title="Monthly Spending, Income & Savings">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ width: "100%", height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: chartTopMargin, right: 20, bottom: 60, left: 20 }}
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
                tick={{ fontSize: 11, fill: SERVER_THEME_TOKENS.chart.axis }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: SERVER_THEME_TOKENS.chart.axis }}
                tickFormatter={formatDollar}
              />
              <Tooltip
                cursor={false}
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const rows = payload
                    .filter((entry) => Number(entry.value ?? 0) > 0)
                    .map((entry) => ({
                      label: String(entry.name ?? entry.dataKey ?? "Amount"),
                      value: formatCurrency(Number(entry.value ?? 0)),
                      color: entry.color,
                    }));

                  return rows.length > 0 ? (
                    <ChartTooltipCard
                      title={typeof label === "string" ? label : undefined}
                      rows={rows}
                    />
                  ) : null;
                }}
              />
              <Bar
                dataKey="Need"
                stackId="spending"
                fill={CATEGORY_HEX_COLORS.Need}
                name="Needs"
                animationDuration={1200}
                animationEasing="ease-out"
                label={(
                  props: ChartLabelPositionProps & { index?: number },
                ) => {
                  const entry =
                    typeof props.index === "number"
                      ? chartData[props.index]
                      : undefined;
                  if (!entry || entry.Want > 0) {
                    return EMPTY_SVG_LABEL;
                  }

                  return (
                    renderBarTotalLabel(
                      props,
                      entry.spendingAmount,
                      labelAngle,
                      labelFontSize,
                    ) ?? EMPTY_SVG_LABEL
                  );
                }}
              />
              <Bar
                dataKey="Want"
                stackId="spending"
                fill={CATEGORY_HEX_COLORS.Want}
                name="Wants"
                animationDuration={1200}
                animationEasing="ease-out"
                radius={[4, 4, 0, 0]}
                label={(
                  props: ChartLabelPositionProps & { index?: number },
                ) => {
                  const entry =
                    typeof props.index === "number"
                      ? chartData[props.index]
                      : undefined;
                  if (!entry || entry.Want <= 0) {
                    return EMPTY_SVG_LABEL;
                  }

                  return (
                    renderBarTotalLabel(
                      props,
                      entry.spendingAmount,
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
                label={(
                  props: ChartLabelPositionProps & { index?: number },
                ) => {
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
              <Bar
                dataKey="Saving"
                fill={CATEGORY_HEX_COLORS.Saving}
                name="Savings"
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={300}
                radius={[4, 4, 0, 0]}
                label={(
                  props: ChartLabelPositionProps & { index?: number },
                ) => {
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
                      entry.Saving,
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
    </ChartWrapper>
  );
}
