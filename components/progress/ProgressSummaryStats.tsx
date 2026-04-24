"use client";

// Note 1: ProgressSummaryStats is a pure presentational component — it derives
// metrics from already-fetched data passed as props, performs no API calls of
// its own, and stays in sync with the parent page state.

import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import {
  computeGoalProgress,
  getLatestRetirementTotal,
  getLatestSalary,
} from "@/lib/progress/progress-summary";
import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

interface Props {
  retirementEntries: RetirementEntry[];
  salaryEntries: SalaryEntry[];
  /** The goal target amount; null when no goal has been set. */
  goalTargetAmount: number | null;
  /** The latest retirement end amount as returned by the goal API; null when unavailable. */
  latestEnd: number | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor?: string;
  /** Alpha-tinted background for the icon circle; falls back to action.hover. */
  iconBgColor?: string;
}

function StatCard({
  icon,
  label,
  value,
  iconColor,
  iconBgColor,
}: StatCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 2.5,
          "&:last-child": { pb: 2.5 },
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: iconBgColor ?? "action.hover",
            color: iconColor ?? "primary.main",
            flexShrink: 0,
            "& svg": { fontSize: 26 },
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2} noWrap>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const EMPTY_VALUE = "—";

function formatCurrency(n: number | null): string {
  if (n === null) return EMPTY_VALUE;
  return `$${n.toLocaleString()}`;
}

function formatPercent(pct: number | null): string {
  if (pct === null) return EMPTY_VALUE;
  return `${pct}%`;
}

// Note: useTheme is used here (not inside StatCard) so StatCard stays a pure
// presentational component that can be used outside of a MUI theme context.
export default function ProgressSummaryStats({
  retirementEntries,
  salaryEntries,
  goalTargetAmount,
  latestEnd,
}: Props) {
  const theme = useTheme();
  // Note 2: The total-saved stat uses the latestEnd supplied by the goal API
  // (authoritative server value) with a fallback to the highest year in the
  // local retirement entries array so the card can populate even without a goal.
  const totalSaved = latestEnd ?? getLatestRetirementTotal(retirementEntries);
  const latestSalary = getLatestSalary(salaryEntries);
  const { rawPct } = computeGoalProgress(latestEnd, goalTargetAmount);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      <StatCard
        icon={<TrackChangesOutlinedIcon />}
        label="Progress to Goal"
        value={formatPercent(rawPct)}
        iconColor="primary.main"
        iconBgColor={alpha(theme.palette.primary.main, 0.15)}
      />
      <StatCard
        icon={<SavingsOutlinedIcon />}
        label="Total Saved"
        value={formatCurrency(totalSaved)}
        iconColor="success.main"
        iconBgColor={alpha(theme.palette.success.main, 0.15)}
      />
      <StatCard
        icon={<TrendingUpOutlinedIcon />}
        label="Latest Salary"
        value={formatCurrency(latestSalary)}
        iconColor="warning.main"
        iconBgColor={alpha(theme.palette.warning.main, 0.15)}
      />
    </Box>
  );
}
