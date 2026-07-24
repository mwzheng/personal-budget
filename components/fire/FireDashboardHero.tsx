"use client";

import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { formatFireDateLabel } from "@/lib/utils/fire";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";
import {
  getFireProgress,
  getFireRemaining,
  getFireStatus,
} from "@/lib/utils/fire-dashboard";
import type {
  FireProjectionRow,
  FireScenario,
  FireSummary,
} from "@/lib/types/types";

interface Props {
  scenario: FireScenario;
  summary: FireSummary;
  rows: FireProjectionRow[];
}

const statusCopy = {
  reached: { label: "FIRE reached", color: "success" as const },
  projected: { label: "Projected to FIRE", color: "info" as const },
  unreachable: { label: "Outside projection", color: "warning" as const },
  "no-target": { label: "No target set", color: "default" as const },
};

export default function FireDashboardHero({ scenario, summary, rows }: Props) {
  const target = summary.fireNumber;
  const progress = getFireProgress(scenario.currentBalance, target);
  const remaining = getFireRemaining(scenario.currentBalance, target);
  const status = getFireStatus(scenario.currentBalance, target, rows);
  const statusLabel = statusCopy[status];

  const headline =
    status === "reached"
      ? "You have reached FIRE"
      : summary.yearsToFire !== null
        ? `You could reach FIRE in ${summary.yearsToFire} year${summary.yearsToFire === 1 ? "" : "s"}`
        : status === "no-target"
          ? "Set a FIRE target to begin"
          : "Your FIRE target needs a closer look";

  const description =
    status === "reached"
      ? "Your current balance is at or above the target."
      : summary.yearsToFire !== null
        ? `At your current contribution rate, your portfolio is projected to cross your target in ${formatFireDateLabel(summary.fireDate)}.`
        : status === "no-target"
          ? "Enter a positive withdrawal rate or target to see your path to financial independence."
          : "Your portfolio does not cross the target within the current projection window. Try adjusting your assumptions.";

  return (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: SERVER_THEME_TOKENS.border.standard,
      }}
      elevation={1}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.25fr) minmax(280px, 0.75fr)",
          },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        <Stack spacing={1.5} justifyContent="center">
          <Typography variant="overline" color="text.secondary">
            {scenario.name} · {statusLabel.label}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {headline}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 0.75 }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress toward target
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {Math.round(progress * 100)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress * 100}
              aria-label="Progress toward FIRE target"
              sx={{ height: 9, borderRadius: 5 }}
            />
          </Box>
        </Stack>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 2,
            bgcolor: "action.hover",
            borderRadius: 1.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Target portfolio
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            {formatCurrencyWhole(target)}
          </Typography>
          <Typography variant="body2" color="success.main" fontWeight={700}>
            {formatCurrencyWhole(scenario.currentBalance)} invested
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {status === "no-target"
              ? "Set a target to calculate the amount to go."
              : `${formatCurrencyWhole(remaining)} to go · ${scenario.withdrawalRate * 100}% withdrawal rate`}
          </Typography>
          <Chip
            label={statusLabel.label}
            color={statusLabel.color}
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start", mt: 1.5 }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
