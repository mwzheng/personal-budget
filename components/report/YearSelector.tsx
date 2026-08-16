"use client";

import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

interface YearSelectorProps {
  availableYears: string[];
  selectedYear: number;
  currentYear: number;
  onChange: (year: number) => void;
}

export function YearSelector({
  availableYears,
  selectedYear,
  currentYear,
  onChange,
}: YearSelectorProps) {
  const years = Array.from(
    new Set([String(currentYear), ...availableYears, String(selectedYear)]),
  ).sort((a, b) => Number(b) - Number(a));

  return (
    <TextField
      select
      size="small"
      label="Report year"
      value={String(selectedYear)}
      onChange={(event) => onChange(Number(event.target.value))}
      SelectProps={{ inputProps: { "aria-label": "Report year" } }}
      sx={{ minWidth: 164 }}
    >
      {years.map((year) => (
        <MenuItem key={year} value={year}>
          {year}
          {year === String(currentYear) ? " (current year)" : ""}
        </MenuItem>
      ))}
    </TextField>
  );
}
