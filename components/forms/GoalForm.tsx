// Note 1: GoalForm is a reusable form that supports both creating a new goal
// (POST) and updating an existing one (PUT). The distinction is determined by
// whether `defaultGoal.goalId` is present. This "upsert" pattern avoids the
// need for two separate form components.
"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { apiFetch } from "@/lib/apiFetch";

type Goal = {
  goalId?: string;
  name: string;
  targetAmount: number;
  currentSaved?: number;
  monthlyContribution?: number;
  expectedAnnualReturn?: number;
};

export default function GoalForm({
  defaultGoal,
  onSaved,
  onCancel,
}: {
  defaultGoal?: Goal;
  onSaved?: (g: any) => void;
  onCancel?: () => void;
}) {
  // Note 2: Numeric fields are stored as strings in component state so they
  // can be edited freely in a text input (e.g. the user can type "100." while
  // mid-entry). They are converted to numbers only at submit time with `Number(...)`.
  const [name, setName] = useState(defaultGoal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    String(defaultGoal?.targetAmount ?? ""),
  );
  const [currentSaved, setCurrentSaved] = useState(
    String(defaultGoal?.currentSaved ?? ""),
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    String(defaultGoal?.monthlyContribution ?? ""),
  );
  const [expectedAnnualReturn, setExpectedAnnualReturn] = useState(
    String(defaultGoal?.expectedAnnualReturn ?? ""),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        goalId: defaultGoal?.goalId,
        name,
        targetAmount: Number(targetAmount),
        currentSaved: Number(currentSaved),
        monthlyContribution: Number(monthlyContribution),
        expectedAnnualReturn: Number(expectedAnnualReturn),
      };
      // Note 3: If `defaultGoal.goalId` exists we are editing an existing goal
      // so PUT is used. Otherwise POST creates a new goal. The API assigns the
      // `goalId` on the server for new goals, ensuring unique IDs from one place.
      const res = await apiFetch("/api/goals", {
        method: defaultGoal?.goalId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      // Note 4: `onSaved?.()` uses optional chaining to call the callback only
      // if it was provided. The parent component uses this to close the form and
      // refresh the goal list after a successful save.
      onSaved?.(data.created || data.updated);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 680 }}>
      <Stack spacing={2}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Target Amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          type="number"
          required
        />
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
          value={expectedAnnualReturn}
          onChange={(e) => setExpectedAnnualReturn(e.target.value)}
          type="number"
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit" disabled={loading}>
            {defaultGoal?.goalId ? "Update" : "Create"}
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
