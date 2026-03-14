// Note 1: MilestoneForm intentionally mirrors the salary/retirement form shape
// so the progress dialogs feel consistent. It owns only the add-flow state today
// because milestones do not yet expose an edit API route.
"use client";

import React, { useState } from "react";
import { Box, Button, Stack, TextField } from "@mui/material";
import { apiFetch } from "@/lib/apiFetch";
import { sanitizeNumberString } from "@/lib/format";

interface Props {
  onSaved?: () => void | Promise<void>;
  onCancel?: () => void;
}

export default function MilestoneForm({ onSaved, onCancel }: Props) {
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!amount || loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const body: { amount: number; year?: number; age?: number } = {
        amount: Number(sanitizeNumberString(amount)),
      };

      if (year) {
        body.year = Number(sanitizeNumberString(year));
      }

      if (age) {
        body.age = Number(sanitizeNumberString(age));
      }

      const response = await apiFetch("/api/progress/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Create failed");
      }

      await Promise.resolve(onSaved?.());
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : String(submitError),
      );
    } finally {
      setLoading(false);
    }
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
          type="number"
        />
        <TextField
          label="Age"
          value={age}
          onChange={(event) => setAge(sanitizeNumberString(event.target.value))}
          type="number"
        />
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !amount}
          >
            Add
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
