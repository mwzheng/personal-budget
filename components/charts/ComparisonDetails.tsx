"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import { rankComparisonTags } from "@/lib/utils/aggregations";
import { formatCurrency } from "@/lib/utils/format";
import type { ComparisonSummary } from "@/lib/types/types";

export function ChangeIndicator({
  value,
  positiveIsFavorable = false,
  suffix = "%",
}: {
  value: number | null;
  positiveIsFavorable?: boolean;
  suffix?: string;
}) {
  if (value === null)
    return (
      <Chip
        label="New"
        size="small"
        sx={{
          fontSize: "0.7rem",
          height: 22,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      />
    );
  if (value === 0)
    return (
      <Chip
        label="No change"
        size="small"
        sx={{
          fontSize: "0.7rem",
          height: 22,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      />
    );
  const color = (positiveIsFavorable ? value > 0 : value < 0)
    ? "#15803D"
    : "#B91C1C";
  return (
    <Chip
      icon={
        value > 0 ? (
          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
        ) : (
          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
        )
      }
      label={`${Math.abs(value).toFixed(1)}${suffix}`}
      size="small"
      sx={{
        fontSize: "0.7rem",
        height: 22,
        color,
        bgcolor: `${color}1a`,
        "& .MuiChip-icon": { color },
      }}
    />
  );
}

export interface ComparisonMetric {
  key: string;
  label: string;
  previous: number;
  current: number;
  change: number | null;
  color?: string;
  formatter?: (value: number) => string;
  positiveIsFavorable?: boolean;
  changeSuffix?: string;
  previousDisplay?: string;
  currentDisplay?: string;
}

export function ComparisonSummaryCards({
  metrics,
  previousLabel,
  currentLabel,
}: {
  metrics: ComparisonMetric[];
  previousLabel: string;
  currentLabel: string;
}) {
  return (
    <Grid container spacing={2} mb={3}>
      {metrics.map((metric) => (
        <Grid key={metric.key} item xs={12} sm={6} md={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={1}
                mb={1.5}
              >
                <Typography variant="caption" color="text.secondary">
                  {metric.label}
                </Typography>
                <ChangeIndicator
                  value={metric.change}
                  positiveIsFavorable={metric.positiveIsFavorable}
                  suffix={metric.changeSuffix}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {[
                  [previousLabel, metric.previous, metric.previousDisplay],
                  [currentLabel, metric.current, metric.currentDisplay],
                ].map(([label, value, display]) => (
                  <Box key={String(label)} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontSize="0.7rem"
                      mb={0.5}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{
                        color: metric.color ?? "text.primary",
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {display ??
                        (metric.formatter ?? formatCurrency)(Number(value))}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function TagsComparison({
  previous,
  current,
  previousLabel,
  currentLabel,
}: {
  previous: ComparisonSummary;
  current: ComparisonSummary;
  previousLabel: string;
  currentLabel: string;
}) {
  const tags = useMemo(
    () => rankComparisonTags(previous.topTags, current.topTags),
    [previous.topTags, current.topTags],
  );
  if (!tags.length)
    return (
      <Typography color="text.secondary" variant="body2">
        No tagged spending for the selected periods.
      </Typography>
    );
  const previousMap = Object.fromEntries(
    previous.topTags.map((tag) => [tag.name, tag.value]),
  );
  const currentMap = Object.fromEntries(
    current.topTags.map((tag) => [tag.name, tag.value]),
  );
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Top Tagged Spending
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1.2fr) repeat(3, minmax(84px, 1fr))",
            sm: "minmax(0, 1.2fr) repeat(3, minmax(110px, 1fr))",
          },
          columnGap: { xs: 1.5, sm: 2.5 },
          rowGap: 1.25,
          alignItems: "center",
        }}
      >
        {["Tag", previousLabel, currentLabel, "Change"].map((label) => (
          <Typography
            key={label}
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            textAlign={label === "Tag" ? "left" : "right"}
          >
            {label}
          </Typography>
        ))}
        {tags.slice(0, 10).map((tag) => {
          const a = previousMap[tag] ?? 0;
          const b = currentMap[tag] ?? 0;
          return (
            <Box key={tag} display="contents">
              <Typography variant="body2" noWrap>
                {tag}
              </Typography>
              <Typography variant="body2" textAlign="right">
                {formatCurrency(a)}
              </Typography>
              <Typography variant="body2" textAlign="right">
                {formatCurrency(b)}
              </Typography>
              <Box textAlign="right">
                <ChangeIndicator
                  value={a === 0 ? (b === 0 ? 0 : null) : ((b - a) / a) * 100}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
