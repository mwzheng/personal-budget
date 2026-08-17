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
  onSaved,
  onCancel,
}: Props) {
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [age, setAge] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setAmount(existingMilestone ? String(existingMilestone.amount) : "");
    setYear(
      existingMilestone?.year != null ? String(existingMilestone.year) : "",
    );
    setMonth(
      existingMilestone?.month != null ? String(existingMilestone.month) : "",
    );
    setAge(existingMilestone?.age != null ? String(existingMilestone.age) : "");
    setNote(existingMilestone?.note ?? "");
  }, [existingMilestone]);

  const {
    submit: apiSubmit,
    isSubmitting: loading,
    error,
  } = useFormSubmit({
    baseUrl: "/api/progress/milestones",
    onSuccess: onSaved,
  });

  const yearRequired = !existingMilestone || existingMilestone.year != null;
  const monthRequired = !existingMilestone || existingMilestone.month != null;

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
      loading
    ) {
      return;
    }

    const body: Record<string, unknown> = {
      amount: Number(sanitizeNumberString(amount)),
      year: year ? numericYear : null,
      month: month ? numericMonth : null,
    };

    if (age) {
      body.age = Number(sanitizeNumberString(age));
    }
    if (note.trim()) body.note = note.trim();
    if (existingMilestone) {
      body.milestoneId = existingMilestone.milestoneId;
      body.originalYear = existingMilestone.year;
      if (existingMilestone.createdAt)
        body.createdAt = existingMilestone.createdAt;
    }

    await apiSubmit(body, Boolean(existingMilestone));
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 480, pt: 1 }}>
      <Stack spacing={2}>
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
          helperText="Enter a four-digit calendar year."
        />
        <FormControl required={monthRequired} fullWidth>
          <InputLabel id="milestone-month-label">Month</InputLabel>
          <Select
            labelId="milestone-month-label"
            label="Month"
            value={month}
            onChange={(event) => setMonth(String(event.target.value))}
          >
            {MONTHS.map((monthName, index) => (
              <MenuItem key={monthName} value={String(index + 1)}>
                {monthName}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Choose the month this milestone was reached.
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
