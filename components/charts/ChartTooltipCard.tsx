/**
 * Note 1: Recharts makes it easy to share one tooltip shell across multiple
 * chart types. Centralizing the card styling here keeps the pie and bar charts
 * visually consistent while each chart still controls its own data mapping.
 */
"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ChartTooltipRow {
  key?: string;
  label: string;
  value: string;
  color?: string;
}

interface Props {
  title?: string;
  rows: ChartTooltipRow[];
}

export function ChartTooltipCard({ title, rows }: Props) {
  if (!rows.length) {
    return null;
  }

  return (
    <Box
      sx={{
        minWidth: 140,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        backgroundColor: "background.paper",
        px: 1.5,
        py: 1,
      }}
    >
      {title ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 0.75,
            color: "text.primary",
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>
      ) : null}
      <Stack spacing={0.75}>
        {rows.map((row) => (
          <Stack
            key={row.key ?? `${row.label}-${row.value}`}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={0.75}>
              {row.color ? (
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: row.color,
                  }}
                />
              ) : null}
              <Typography variant="caption" sx={{ color: "text.primary" }}>
                {row.label}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: "text.primary", fontWeight: 700 }}
            >
              {row.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
