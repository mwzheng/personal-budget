"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Stack, Typography } from "@mui/material";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { apiFetch } from "@/lib/api/apiFetch";

interface ProgressGoal {
  goalId?: string;
  targetAmount: number;
}

interface GoalApiResponse {
  ok: boolean;
  goals?: ProgressGoal[];
  latestEnd?: number;
  error?: string;
}

export default function GoalEditor() {
  const [goal, setGoal] = useState<ProgressGoal | null>(null);
  const [target, setTarget] = useState("");
  const [latestEnd, setLatestEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGoal = async () => {
    try {
      const res = await apiFetch("/api/progress/goal");
      const data = (await res.json()) as GoalApiResponse;
      if (data.ok) {
        const primaryGoal = data.goals?.[0] ?? null;
        setGoal(primaryGoal);
        setLatestEnd(data.latestEnd ?? null);
        setTarget(String(primaryGoal?.targetAmount ?? ""));
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void fetchGoal();
  }, []);

  const save = async () => {
    if (!target) return;
    setLoading(true);
    try {
      // Note 1: Build payload explicitly to avoid drifting request shapes.
      const body: { targetAmount: number; goalId?: string } = {
        targetAmount: Number(target),
      };
      if (goal?.goalId) body.goalId = goal.goalId;
      const method = goal?.goalId ? "PUT" : "POST";
      const res = await apiFetch("/api/progress/goal", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      await fetchGoal();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pct =
    goal && latestEnd !== null
      ? Math.round((latestEnd / goal.targetAmount) * 10000) / 100
      : null;

  return (
    <Box>
      <SectionHeader title="Progress Goal" sx={{ mb: 1.5 }} />
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Target amount"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          type="number"
        />
        <Button
          variant="contained"
          onClick={save}
          disabled={loading || !target}
        >
          Save
        </Button>
      </Stack>
      <Box sx={{ mt: 1 }}>
        {goal ? (
          <Typography>
            Current target: ${Number(goal.targetAmount).toLocaleString()} —
            Latest progress:{" "}
            {latestEnd !== null
              ? `$${Number(latestEnd).toLocaleString()}`
              : "N/A"}{" "}
            {pct !== null ? `(${pct}%)` : ""}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
