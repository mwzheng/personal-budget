// Note 1: RetirementForm handles POST (create) and PUT (update) for retirement
// progress entries. The upsert logic is delegated to useFormSubmit so the form
// only owns field state and body construction.
"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { sanitizeNumberString } from "@/lib/utils/format";
import type { RetirementEntry } from "@/lib/types/types";

export default function RetirementForm({
  defaultEntry,
  latestEndAmount,
  onSaved,
  onCancel,
}: {
  defaultEntry?: RetirementEntry;
  latestEndAmount?: number;
  onSaved?: (entry: RetirementEntry) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [year, setYear] = useState(
    String(defaultEntry?.year ?? new Date().getFullYear() - 1),
  );
  const [startAmount, setStartAmount] = useState(
    String(defaultEntry?.startAmount ?? latestEndAmount ?? 0),
  );
  const [endAmount, setEndAmount] = useState(
    String(defaultEntry?.endAmount ?? "0"),
  );

  const {
    submit: apiSubmit,
    isSubmitting: loading,
    error,
  } = useFormSubmit<RetirementEntry>({
    baseUrl: "/api/progress/retirement",
    onSuccess: onSaved,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      Number(year) >= new Date().getFullYear() &&
      Number(year) !== defaultEntry?.year
    )
      return;
    const body: Record<string, unknown> = {
      year: Number(sanitizeNumberString(year)),
      startAmount: Number(sanitizeNumberString(startAmount)),
      endAmount: Number(sanitizeNumberString(endAmount)),
    };
    if (defaultEntry?.entryId) body.entryId = defaultEntry.entryId;
    await apiSubmit(body, Boolean(defaultEntry?.entryId));
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ width: "100%", pt: 1 }}>
      <Stack spacing={2}>
        <TextField
          label="Year"
          disabled={Boolean(defaultEntry)}
          value={year}
          onChange={(e) => setYear(sanitizeNumberString(e.target.value))}
          required
          type="number"
          inputProps={{
            min: 1,
            max: Math.max(
              new Date().getFullYear() - 1,
              defaultEntry?.year ?? 0,
            ),
          }}
        />
        <TextField
          label="Start amount"
          value={startAmount}
          onChange={(e) => setStartAmount(sanitizeNumberString(e.target.value))}
          required
          type="number"
        />
        <TextField
          label="End amount"
          value={endAmount}
          onChange={(e) => setEndAmount(sanitizeNumberString(e.target.value))}
          required
          type="number"
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit" disabled={loading}>
            {defaultEntry?.entryId ? "Update" : "Add"}
          </Button>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        </Stack>
        {error && <Box sx={{ color: "error.main" }}>{error}</Box>}
      </Stack>
    </Box>
  );
}
