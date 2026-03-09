// Note 1: ProjectionForm is a pure "controlled" form component. It does not
// perform any computation itself -- it collects user inputs and calls `onGenerate`
// with them. The computation happens in `ProjectionView`, which keeps logic and
// presentation cleanly separated.
"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";

export default function ProjectionForm({
  onGenerate,
}: {
  onGenerate: (params: {
    currentSaved: number;
    monthlyContribution: number;
    annualReturn: number;
    years: number;
  }) => void;
}) {
  // Note 2: Default values ("0", "500", "0.05", "10") are sensible starting
  // points for exploring the compound interest simulator. A user can see a
  // meaningful chart immediately without entering any data.
  const [currentSaved, setCurrentSaved] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [annualReturn, setAnnualReturn] = useState("0.05");
  const [years, setYears] = useState("10");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Note 3: `Number(...)` coerces the string state values to numbers. If the
    // user clears a field, the resulting empty string becomes `0`, which is safe
    // for the projection math rather than `NaN`.
    onGenerate({
      currentSaved: Number(currentSaved),
      monthlyContribution: Number(monthlyContribution),
      annualReturn: Number(annualReturn),
      years: Number(years),
    });
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ mb: 2 }}>
      <Stack spacing={2}>
        <TextField
          label="Current Saved"
          value={currentSaved}
          onChange={(e) => setCurrentSaved(e.target.value)}
          type="number"
        />
        <TextField
          label="Monthly Contribution"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
          type="number"
        />
        <TextField
          label="Expected Annual Return (decimal, e.g., 0.05)"
          value={annualReturn}
          onChange={(e) => setAnnualReturn(e.target.value)}
          type="number"
        />
        <TextField
          label="Projection Horizon (years)"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          type="number"
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit">
            Generate
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
