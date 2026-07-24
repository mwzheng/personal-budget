"use client";

import React from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FireScenario, FireSummary } from "@/lib/types/types";

interface Props {
  scenario: FireScenario;
  summary: FireSummary;
}

export default function FireNextMoveCard({ scenario, summary }: Props) {
  const scrollToAssumptions = () => {
    const assumptions = document.getElementById("fire-assumptions");
    assumptions?.scrollIntoView({ behavior: "smooth", block: "start" });
    (assumptions?.querySelector("input") as HTMLInputElement | null)?.focus({
      preventScroll: true,
    });
  };

  return (
    <Card sx={{ width: "100%", height: "100%" }} variant="outlined">
      <CardContent sx={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Next move
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust the assumptions that drive {scenario.name}&apos;s projection.
            The result depends on your balance, contribution, return, inflation,
            expenses, and withdrawal-rate inputs.
          </Typography>
          {summary.fireNumber > 0 && summary.yearsToFire === null && (
            <Typography variant="body2" color="warning.main">
              This projection does not reach the target yet, so changing an
              assumption may materially change the timeline.
            </Typography>
          )}
          <Button
            onClick={scrollToAssumptions}
            endIcon={<ArrowForwardIcon />}
            sx={{ alignSelf: "flex-start", mt: "auto" }}
          >
            Review assumptions
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
