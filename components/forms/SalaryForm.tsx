// Note 1: SalaryForm handles both creating a new salary record (POST) and
// editing an existing one (PUT). The year field is defaulted to the current
// calendar year so the user rarely needs to change it.
"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { sanitizeNumberString } from "@/lib/utils/format";

export default function SalaryForm({
  defaultEntry,
  onSaved,
  onCancel,
}: {
  defaultEntry?: any;
  onSaved?: (e: any) => void;
  onCancel?: () => void;
}) {
  // Note 2: `new Date().getFullYear()` is called once at component initialization,
  // so the year does not update while the form is open -- this is the expected
  // behavior for a "default year" field.
  const [year, setYear] = useState(
    String(defaultEntry?.year ?? new Date().getFullYear()),
  );
  const [amount, setAmount] = useState(String(defaultEntry?.amount ?? "0"));
  const [note, setNote] = useState(defaultEntry?.note ?? "");

  const {
    submit: apiSubmit,
    isSubmitting: loading,
    error,
  } = useFormSubmit({ baseUrl: "/api/salary", onSuccess: onSaved });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Note 3: `entryId` is only included in the payload when editing.
    // The API route needs it to construct the DynamoDB sort key
    // ("salary#<year>#<entryId>") for the UpdateItem call.
    const body: Record<string, unknown> = {
      year: Number(sanitizeNumberString(year)),
      amount: Number(sanitizeNumberString(amount)),
      note: note?.trim(),
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
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(sanitizeNumberString(e.target.value))}
          required
          type="number"
        />
        <TextField
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
