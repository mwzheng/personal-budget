// Note 1: RetirementForm handles POST (create) and PUT (update) for retirement
// progress entries. The upsert logic is delegated to useFormSubmit so the form
// only owns field state and body construction.
"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { sanitizeNumberString } from "@/lib/utils/format";

export default function RetirementForm({
  defaultEntry,
  onSaved,
  onCancel,
}: {
  defaultEntry?: any;
  onSaved?: (e: any) => void;
  onCancel?: () => void;
}) {
  const [year, setYear] = useState(
    String(defaultEntry?.year ?? new Date().getFullYear()),
  );
  const [startAmount, setStartAmount] = useState(
    String(defaultEntry?.startAmount ?? "0"),
  );
  const [endAmount, setEndAmount] = useState(
    String(defaultEntry?.endAmount ?? "0"),
  );

  const {
    submit: apiSubmit,
    isSubmitting: loading,
    error,
  } = useFormSubmit({
    baseUrl: "/api/progress/retirement",
    onSuccess: onSaved,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      year: Number(sanitizeNumberString(year)),
      startAmount: Number(sanitizeNumberString(startAmount)),
      endAmount: Number(sanitizeNumberString(endAmount)),
    };
    if (defaultEntry?.entryId) body.entryId = defaultEntry.entryId;
    await apiSubmit(body, Boolean(defaultEntry?.entryId));
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 480 }}>
      <Stack spacing={2}>
        <TextField
          label="Year"
          value={year}
          onChange={(e) => setYear(sanitizeNumberString(e.target.value))}
          required
          type="number"
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
