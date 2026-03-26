// Note 1: GoalForm is a reusable form that supports both creating a new goal
// (POST) and updating an existing one (PUT). The distinction is determined by
// whether `defaultGoal.goalId` is present. This "upsert" pattern is handled by
// the shared useFormSubmit hook so the form only owns field state.
"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { sanitizeNumberString } from "@/lib/utils/format";

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

  // Note 3: useFormSubmit handles the POST/PUT decision, loading state, error
  // state, and the `{ ok, created, updated }` response contract. The form only
  // needs to construct the body and call `apiSubmit`.
  const {
    submit: apiSubmit,
    isSubmitting: loading,
    error,
  } = useFormSubmit({ baseUrl: "/api/goals", onSuccess: onSaved });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Note 4: `goalId` is always included in the body — the server ignores it
    // for POST (new goals get a server-assigned ID) and uses it for PUT lookups.
    const body: Record<string, unknown> = {
      goalId: defaultGoal?.goalId,
      name: name.trim(),
      targetAmount: Number(sanitizeNumberString(targetAmount)),
      currentSaved: Number(sanitizeNumberString(currentSaved)),
      monthlyContribution: Number(sanitizeNumberString(monthlyContribution)),
      expectedAnnualReturn: Number(sanitizeNumberString(expectedAnnualReturn)),
    };
    await apiSubmit(body, Boolean(defaultGoal?.goalId));
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
          onChange={(e) =>
            setTargetAmount(sanitizeNumberString(e.target.value))
          }
          type="number"
          required
        />
        <TextField
          label="Current Saved"
          value={currentSaved}
          onChange={(e) =>
            setCurrentSaved(sanitizeNumberString(e.target.value))
          }
          type="number"
        />
        <TextField
          label="Monthly Contribution"
          value={monthlyContribution}
          onChange={(e) =>
            setMonthlyContribution(sanitizeNumberString(e.target.value))
          }
          type="number"
        />
        <TextField
          label="Expected Annual Return (decimal, e.g., 0.05)"
          value={expectedAnnualReturn}
          onChange={(e) =>
            setExpectedAnnualReturn(sanitizeNumberString(e.target.value))
          }
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
