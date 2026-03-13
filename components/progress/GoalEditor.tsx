"use client";
import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Stack, Typography } from "@mui/material";
import { apiFetch } from "@/lib/apiFetch";

export default function GoalEditor() {
  const [goal, setGoal] = useState<any | null>(null);
  const [target, setTarget] = useState("");
  const [latestEnd, setLatestEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGoal = async () => {
    try {
      const res = await apiFetch("/api/progress/goal");
      const data = await res.json();
      if (data.ok) {
        setGoal((data.goals && data.goals[0]) || null);
        setLatestEnd(data.latestEnd ?? null);
        setTarget(((data.goals && data.goals[0])?.targetAmount ?? "") + "");
      }
    } catch (err) {
      /*ignore*/
    }
  };

  useEffect(() => {
    fetchGoal();
  }, []);

  const save = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const body: any = { targetAmount: Number(target) };
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
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pct =
    goal && latestEnd
      ? Math.round((latestEnd / goal.targetAmount) * 10000) / 100
      : null;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Progress Goal
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Target amount"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          type="number"
        />
        <Button variant="contained" onClick={save} disabled={loading}>
          Save
        </Button>
      </Stack>
      <Box sx={{ mt: 1 }}>
        {goal && (
          <Typography>
            Current target: ${Number(goal.targetAmount).toLocaleString()} —
            Latest progress:{" "}
            {latestEnd !== null
              ? `$${Number(latestEnd).toLocaleString()}`
              : "N/A"}{" "}
            {pct !== null ? `(${pct}%)` : ""}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
