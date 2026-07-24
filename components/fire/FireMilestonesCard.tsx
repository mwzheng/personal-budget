"use client";

import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { getFireMilestoneProgress } from "@/lib/utils/fire-dashboard";

interface Props {
  currentBalance: number;
  target: number;
}

export default function FireMilestonesCard({ currentBalance, target }: Props) {
  const milestones = getFireMilestoneProgress(currentBalance, target);

  return (
    <Card sx={{ width: "100%", height: "100%" }} variant="outlined">
      <CardContent sx={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Milestones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Target-relative checkpoints
            </Typography>
          </Box>
          {target <= 0 ? (
            <Typography variant="body2" color="text.secondary">
              Set a target to see your FIRE milestones.
            </Typography>
          ) : (
            milestones.map((milestone) => (
              <Box key={milestone.percentage}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2">
                    {milestone.percentage}% ·{" "}
                    {formatCurrencyWhole(milestone.amount)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      milestone.reached ? "success.main" : "text.secondary"
                    }
                  >
                    {milestone.reached
                      ? "Reached"
                      : `${Math.round(milestone.progress * 100)}%`}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={milestone.progress * 100}
                  aria-label={`${milestone.percentage}% FIRE milestone progress`}
                />
              </Box>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
