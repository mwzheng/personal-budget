/**
 * Note 1: Shared empty-state presentation extracted from the list components
 * (BudgetList, SalaryList, RetirementList, MilestonesList).
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
    <Box
      sx={{
        py: 2.5,
        px: 1,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      {icon ? (
        <Box
          aria-hidden="true"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "action.hover",
            color: "text.secondary",
            "& svg": {
              fontSize: 28,
            },
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Typography
        color="text.secondary"
        variant={variant}
        sx={{ maxWidth: 360 }}
      >
        {message}
      </Typography>
    </Box>
  );
}
