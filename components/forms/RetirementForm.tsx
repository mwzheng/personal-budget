"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { apiFetch } from "@/lib/apiFetch";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: any = {
        year: Number(year),
        startAmount: Number(startAmount),
        endAmount: Number(endAmount),
      };
      if (defaultEntry?.entryId) body.entryId = defaultEntry.entryId;
      const res = await apiFetch("/api/progress/retirement", {
        method: defaultEntry?.entryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      onSaved?.(data.created || data.updated);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 480 }}>
      <Stack spacing={2}>
        <TextField
          label="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
          type="number"
        />
        <TextField
          label="Start amount"
          value={startAmount}
          onChange={(e) => setStartAmount(e.target.value)}
          required
          type="number"
        />
        <TextField
          label="End amount"
          value={endAmount}
          onChange={(e) => setEndAmount(e.target.value)}
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
