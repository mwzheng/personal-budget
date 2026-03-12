/**
 * Note 1: This shared legend renderer keeps chart legends visually consistent
 * across Recharts components while still letting each chart tune spacing.
 * Recharts exposes legend payload data but leaves layout details to the caller.
 */
"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface LegendEntry {
  color?: string;
  dataKey?: unknown;
  value?: unknown;
}

interface Props {
  payload?: readonly LegendEntry[];
  gap?: number;
  justifyContent?: "flex-start" | "center" | "flex-end";
}

export function ChartLegend({
  payload,
  gap = 2,
  justifyContent = "center",
}: Props) {
  if (!payload?.length) {
    return null;
  }

  return (
    <Box
      component="ul"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent,
        gap,
        listStyle: "none",
        m: 0,
        p: 0,
      }}
    >
      {payload.map((entry, index) => {
        const label = entry.value ?? entry.dataKey ?? `legend-${index}`;

        return (
          <Box
            component="li"
            key={`${label}-${index}`}
            sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
          >
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: entry.color ?? "#888",
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", lineHeight: 1.2 }}
            >
              {String(label)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
