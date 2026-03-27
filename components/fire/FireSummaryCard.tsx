"use client";

import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatCurrencyWhole } from "@/lib/utils/format";
import type { FireSummary } from "@/lib/types/types";

interface Props {
  summary: FireSummary | null;
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "success" | "warning" | "info";
}) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 120, flex: "1 1 0" }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Chip
        label={value}
        color={color ?? "default"}
        variant="outlined"
        sx={{ mt: 0.5, fontWeight: 700, fontSize: "0.9rem" }}
      />
    </Box>
  );
}

export default function FireSummaryCard({ summary }: Props) {
  if (!summary) return null;

  const yearsLabel =
    summary.yearsToFire !== null
      ? `${summary.yearsToFire} year${summary.yearsToFire === 1 ? "" : "s"}`
      : "Not reachable";

  const fireDateLabel = summary.fireDate
    ? new Date(summary.fireDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Paper sx={{ p: 2.5 }} elevation={1}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        FIRE Summary
      </Typography>
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="space-around"
        gap={2}
        sx={{ mt: 1 }}
      >
        <MetricItem
          label="FIRE Number"
          value={formatCurrencyWhole(summary.fireNumber)}
          color="info"
        />
        <MetricItem
          label="Years to FIRE"
          value={yearsLabel}
          color={summary.yearsToFire !== null ? "success" : "warning"}
        />
        <MetricItem label="Target Date" value={fireDateLabel} />
        <MetricItem
          label="Total Contributions"
          value={formatCurrencyWhole(summary.totalContributions)}
        />
        <MetricItem
          label="Final Balance"
          value={formatCurrencyWhole(summary.finalBalance)}
        />
        <MetricItem
          label="Final (Inflation-Adj.)"
          value={formatCurrencyWhole(summary.finalBalanceReal)}
        />
      </Stack>
    </Paper>
  );
}
