"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { getProjectedBalanceAtFire } from "@/lib/utils/fire-dashboard";
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

export default function FireMetricGrid({ scenario, summary, rows }: Props) {
  const projectedAtFire = getProjectedBalanceAtFire(rows);
  const metrics = [
    [
      "Years to FIRE",
      summary.yearsToFire === null
        ? "Not reached"
        : String(summary.yearsToFire),
    ],
    ["Monthly contribution", formatCurrencyWhole(scenario.monthlyContribution)],
    ["Annual spending", formatCurrencyWhole(scenario.annualExpenses)],
    [
      "Projected at FIRE",
      projectedAtFire === null
        ? "Not reached"
        : formatCurrencyWhole(projectedAtFire),
    ],
  ];

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      {metrics.map(([label, value]) => (
        <Box key={label} sx={{ width: "100%", minWidth: 0 }}>
          <Paper
            sx={{ p: 2, width: "100%", minWidth: 0, height: "100%" }}
            elevation={1}
          >
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {value}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      ))}
    </Box>
  );
}
