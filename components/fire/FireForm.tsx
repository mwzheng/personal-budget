"use client";

import React from "react";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FireScenario } from "@/lib/types/types";

type ScenarioField = keyof Omit<
  FireScenario,
  "scenarioId" | "createdAt" | "updatedAt"
>;

interface Props {
  values: FireScenario;
  onChange: (field: ScenarioField, value: string | number) => void;
  computedFireNumber: number;
}

function RateSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 15,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}: {(value * 100).toFixed(1)}%
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Slider
          value={value * 100}
          onChange={(_, v) => onChange((v as number) / 100)}
          min={min}
          max={max}
          step={step}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${v}%`}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          value={(value * 100).toFixed(1)}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (Number.isFinite(parsed)) onChange(parsed / 100);
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          sx={{ width: 100 }}
          inputProps={{ "aria-label": label }}
        />
      </Stack>
    </Box>
  );
}

export default function FireForm({
  values,
  onChange,
  computedFireNumber,
}: Props) {
  const handleNumber =
    (field: ScenarioField) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        onChange(field, 0);
        return;
      }
      const parsed = parseFloat(raw);
      if (Number.isFinite(parsed)) onChange(field, parsed);
    };

  const hasOverride =
    values.targetFireNumber != null && values.targetFireNumber > 0;

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Scenario Name"
        value={values.name}
        onChange={(e) => onChange("name", e.target.value)}
        size="small"
        fullWidth
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <TextField
          label="Current Balance"
          type="number"
          value={values.currentBalance || ""}
          onChange={handleNumber("currentBalance")}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
        <TextField
          label="Monthly Contribution"
          type="number"
          value={values.monthlyContribution || ""}
          onChange={handleNumber("monthlyContribution")}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
        <TextField
          label="Annual Expenses"
          type="number"
          value={values.annualExpenses || ""}
          onChange={handleNumber("annualExpenses")}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
        <TextField
          label="Projection Years"
          type="number"
          value={values.projectionYears || ""}
          onChange={handleNumber("projectionYears")}
          size="small"
          fullWidth
          inputProps={{ min: 1, max: 60 }}
        />
      </Box>

      <RateSlider
        label="Annual Return Rate"
        value={values.annualReturnRate}
        onChange={(v) => onChange("annualReturnRate", v)}
        max={20}
      />

      <RateSlider
        label="Annual Inflation Rate"
        value={values.annualInflationRate}
        onChange={(v) => onChange("annualInflationRate", v)}
        max={10}
      />

      <RateSlider
        label="Safe Withdrawal Rate"
        value={values.withdrawalRate}
        onChange={(v) => onChange("withdrawalRate", v)}
        min={1}
        max={10}
        step={0.25}
      />

      <Box>
        <TextField
          label="Target FIRE Number (override)"
          type="number"
          value={
            values.targetFireNumber != null && values.targetFireNumber > 0
              ? values.targetFireNumber
              : ""
          }
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange("targetFireNumber", 0);
              return;
            }
            const parsed = parseFloat(raw);
            if (Number.isFinite(parsed)) onChange("targetFireNumber", parsed);
          }}
          size="small"
          fullWidth
          placeholder={`Auto: $${computedFireNumber.toLocaleString()}`}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          helperText={
            hasOverride
              ? "Using your custom target"
              : `Auto-calculated: $${computedFireNumber.toLocaleString()} (expenses ÷ withdrawal rate)`
          }
        />
      </Box>
    </Stack>
  );
}
