"use client";

import React from "react";
import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import type { MilestoneEntry } from "@/lib/types/types";

interface Props {
  milestones: MilestoneEntry[];
  /** Current saved amount — used to determine reached vs unreached. */
  currentAmount: number | null;
  /** Goal target — defines the full scale of the track. Falls back to max milestone if null. */
  goalTargetAmount: number | null;
}

function fmt(n: number): string {
  return `$${n.toLocaleString()}`;
}

/**
 * Horizontal progress track that plots milestones on a number line from $0 to
 * the goal target. Reached milestones (amount <= currentAmount) are filled;
 * unreached ones are outlined. The current position is marked with a distinct
 * indicator.
 */
export default function MilestoneTrack({
  milestones,
  currentAmount,
  goalTargetAmount,
}: Props) {
  const theme = useTheme();

  if (milestones.length === 0) return null;

  // Determine the scale max — use goal target, or fall back to max milestone.
  const maxScale =
    goalTargetAmount ?? Math.max(...milestones.map((m) => m.amount), 0);
  if (maxScale <= 0) return null;

  const sorted = [...milestones].sort((a, b) => a.amount - b.amount);
  const currentPos = currentAmount !== null ? currentAmount : 0;

  const pctOf = (amount: number) =>
    Math.min(Math.max((amount / maxScale) * 100, 0), 100);

  const currentPct = pctOf(currentPos);

  return (
    <Box sx={{ width: "100%", px: { xs: 1, sm: 2 }, py: 1 }}>
      {/* Scale labels */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          $0
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {fmt(maxScale)}
        </Typography>
      </Box>

      {/* Track */}
      <Box
        sx={{
          position: "relative",
          height: 8,
          borderRadius: 4,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
        }}
      >
        {/* Current progress fill */}
        {currentPct > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${currentPct}%`,
              borderRadius: 4,
              bgcolor: theme.palette.primary.main,
              opacity: 0.3,
            }}
          />
        )}

        {/* Milestone markers */}
        {sorted.map((m) => {
          const pos = pctOf(m.amount);
          const reached = m.amount <= currentPos;
          return (
            <Tooltip
              key={m.milestoneId}
              title={
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" fontWeight={600}>
                    {fmt(m.amount)}
                  </Typography>
                  {m.year && (
                    <Typography variant="caption">Year {m.year}</Typography>
                  )}
                  {m.age && (
                    <Typography variant="caption">Age {m.age}</Typography>
                  )}
                </Box>
              }
              arrow
              placement="top"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: `${pos}%`,
                  transform: "translate(-50%, -50%)",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: `2px solid ${reached ? theme.palette.success.main : theme.palette.text.secondary}`,
                  bgcolor: reached
                    ? theme.palette.success.main
                    : "background.paper",
                  zIndex: 1,
                  cursor: "default",
                  transition: "transform 0.15s ease-in-out",
                  "&:hover": { transform: "translate(-50%, -50%) scale(1.3)" },
                }}
              />
            </Tooltip>
          );
        })}

        {/* Current position indicator */}
        {currentAmount !== null && currentPct > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: -6,
              left: `${currentPct}%`,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${theme.palette.primary.main}`,
            }}
          />
        )}
      </Box>

      {/* Current amount label below the indicator */}
      {currentAmount !== null && (
        <Box sx={{ position: "relative", height: 20, mt: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="primary.main"
            sx={{
              position: "absolute",
              left: `${currentPct}%`,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            Now: {fmt(currentAmount)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
