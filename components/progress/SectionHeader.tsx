"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  title: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Note 1: SectionHeader centralizes the typography and action-button alignment
 * for progress-page sections. Using one component keeps header sizing/style
 * consistent even when individual sections have different controls.
 */
export function SectionHeader({ title, action, sx }: Props) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      sx={sx}
    >
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {action ? (
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>{action}</Box>
      ) : null}
    </Stack>
  );
}
