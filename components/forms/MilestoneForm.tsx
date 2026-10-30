"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { sanitizeNumberString } from "@/lib/utils/format";
import type { MilestoneEntry } from "@/lib/types/types";

interface Props {
  existingMilestone?: MilestoneEntry;
  defaultAmount?: number;
  milestones?: MilestoneEntry[];
  onSaved?: () => void | Promise<void>;
  onCancel?: () => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MilestoneForm({
  existingMilestone,
  defaultAmount,
  milestones = [],
  onSaved,
  onCancel,
}: Props) {
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [age, setAge] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<"achievement" | "target">("achievement");

  useEffect(() => {
    setAmount(
      existingMilestone
        ? String(existingMilestone.amount)
        : defaultAmount != null
          ? String(defaultAmount)
          : "",
    );
    setKind(existingMilestone?.kind ?? "achievement");
    setYear(
      existingMilestone?.year != null ? String(existingMilestone.year) : "",
    );
    setMonth(
      existingMilestone?.month != null ? String(existingMilestone.month) : "",
    );
    setAge(existingMilestone?.age != null ? String(existingMilestone.age) : "");
    setNote(existingMilestone?.note ?? "");
  }, [existingMilestone, defaultAmount]);

  const {
    submit: apiSubmit,
    isSubmitting: loading,
    error,
  } = useFormSubmit({
    baseUrl: "/api/progress/milestones",
    onSuccess: onSaved,
  });

  const isLegacy = Boolean(existingMilestone && !existingMilestone.kind);
  const yearRequired = isLegacy
    ? existingMilestone?.year != null
    : kind === "achievement";
  const monthRequired = isLegacy
    ? existingMilestone?.month != null
    : kind === "achievement";
  const duplicate =
    !isLegacy &&
    kind === "achievement" &&
    milestones.some(
      (m) =>
        m.kind === "achievement" &&
        m.amount === Number(amount) &&
        m.milestoneId !== existingMilestone?.milestoneId,
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const numericYear = Number(year);
    const numericMonth = Number(month);
    if (
      !amount ||
      (yearRequired && !year) ||
      (monthRequired && !month) ||
      (year &&
        (!Number.isInteger(numericYear) ||
          numericYear < 1 ||
          numericYear > 9999)) ||
      (month &&
        (!Number.isInteger(numericMonth) ||
          numericMonth < 1 ||
          numericMonth > 12)) ||
      (month && !year) ||
      (!isLegacy && kind === "target" && Boolean(month) !== Boolean(year)) ||
      duplicate ||
      loading
    ) {
      return;
    }

    const body: Record<string, unknown> = {
      amount: Number(sanitizeNumberString(amount)),
      year: year ? numericYear : null,
      month: month ? numericMonth : null,
    };
    if (!isLegacy) body.kind = kind;

    if (age) {
      body.age = Number(sanitizeNumberString(age));
    }
    if (note.trim()) body.note = note.trim();
    if (existingMilestone) {
      body.milestoneId = existingMilestone.milestoneId;
      body.originalYear = existingMilestone.year ?? null;
      if (existingMilestone.updatedAt)
        body.expectedUpdatedAt = existingMilestone.updatedAt;
    }

    await apiSubmit(body, Boolean(existingMilestone));
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ width: "100%", pt: 1 }}>
      <Stack spacing={2}>
        {!isLegacy && (
          <FormControl fullWidth>
            <InputLabel id="milestone-kind">Milestone Type</InputLabel>
            <Select
              labelId="milestone-kind"
              label="Milestone Type"
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as "achievement" | "target")
              }
            >
              <MenuItem value="achievement">Achievement</MenuItem>
              <MenuItem value="target">Target</MenuItem>
            </Select>
          </FormControl>
        )}
        {duplicate && (
          <Box sx={{ color: "error.main" }}>
            An achievement for this amount already exists.
          </Box>
        )}
        <TextField
          label="Amount"
          value={amount}
          onChange={(event) =>
            setAmount(sanitizeNumberString(event.target.value))
          }
          required
          type="number"
        />
        <TextField
          label="Year"
          value={year}
          onChange={(event) =>
            setYear(sanitizeNumberString(event.target.value))
          }
          required={yearRequired}
          type="number"
          inputProps={{ min: 1, max: 9999 }}
          helperText={
            kind === "target" && !isLegacy
              ? "Optional target year, paired with a month."
              : "Enter the year reached."
          }
        />
        <FormControl required={monthRequired} fullWidth>
          <InputLabel id="milestone-month-label">Month</InputLabel>
          <Select
            labelId="milestone-month-label"
            label="Month"
            value={month}
            onChange={(event) => setMonth(String(event.target.value))}
          >
            {!monthRequired && <MenuItem value="">None</MenuItem>}
            {MONTHS.map((monthName, index) => (
              <MenuItem key={monthName} value={String(index + 1)}>
                {monthName}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {kind === "target" && !isLegacy
              ? "Optional target month."
              : "Choose the month this milestone was reached."}
          </FormHelperText>
        </FormControl>
        <TextField
          label="Age"
          value={age}
          onChange={(event) => setAge(sanitizeNumberString(event.target.value))}
          type="number"
        />
        <TextField
          label="Note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          multiline
          minRows={2}
          inputProps={{ maxLength: 500 }}
          helperText="Optional, up to 500 characters."
        />
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            type="submit"
            disabled={
              loading ||
              !amount ||
              (yearRequired && !year) ||
              (monthRequired && !month)
            }
          >
            {existingMilestone ? "Save" : "Add"}
          </Button>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        </Stack>
        {error ? <Box sx={{ color: "error.main" }}>{error}</Box> : null}
      </Stack>
    </Box>
  );
}
