/**
 * Note 1: Shared empty-state presentation extracted from the list components
 * (BudgetList, GoalList, SalaryList, RetirementList, MilestonesList).
 * Centralising the pattern keeps the visual treatment consistent and avoids
 * duplicating the same Typography + centering boilerplate in every list.
 */
"use client";

import { Box, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";

interface EmptyStateProps {
  /** The text to display when the list has no items. */
  message: string;
  /** Optional icon rendered above the message. */
  icon?: React.ReactNode;
  /**
   * Note 2: Most list components use the default body1 variant, but BudgetList
   * uses body2 for a slightly smaller hint. Exposing the prop keeps the exact
   * visual parity when each consumer migrates to this component.
   */
  variant?: TypographyProps["variant"];
}

export default function EmptyState({
  message,
  icon,
  variant,
}: EmptyStateProps) {
  return (
    <Box sx={{ py: 2, textAlign: "center" }}>
      {icon ? <Box sx={{ mb: 1 }}>{icon}</Box> : null}
      <Typography color="text.secondary" variant={variant}>
        {message}
      </Typography>
    </Box>
  );
}
