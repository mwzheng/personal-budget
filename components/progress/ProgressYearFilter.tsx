"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

interface Props {
  availableYears: string[];
  selectedYears: string[];
  onChange: (years: string[]) => void;
}

/**
 * Note 1: The filter uses a horizontally scrollable multi-select control instead
 * of tabs because the user can toggle several years at once. A plain array of
 * selected values also maps directly to chart filtering logic.
 */
export function ProgressYearFilter({
  availableYears,
  selectedYears,
  onChange,
}: Props) {
  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2" fontWeight={600}>
        Year Filter
      </Typography>

      {availableYears.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Add salary or retirement history to filter the charts by year.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto", pb: 0.5 }}>
          <ToggleButtonGroup
            value={selectedYears}
            onChange={(_event, nextYears) =>
              onChange(Array.isArray(nextYears) ? nextYears : [])
            }
            size="small"
            aria-label="Filter progress charts by year"
            sx={{
              display: "inline-flex",
              flexWrap: "nowrap",
              minWidth: "max-content",
              gap: 1,
              "& .MuiToggleButtonGroup-grouped": {
                borderRadius: 1,
                borderColor: "divider",
                px: 1.5,
                textTransform: "none",
                whiteSpace: "nowrap",
              },
            }}
          >
            {availableYears.map((year) => (
              <ToggleButton
                key={year}
                value={year}
                aria-label={`Toggle year ${year}`}
              >
                {year}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
    </Stack>
  );
}
