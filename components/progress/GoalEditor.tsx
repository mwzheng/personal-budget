"use client";

import React, { type FormEvent, useCallback, useEffect, useState } from "react";
import { Box, Button, Stack, TextField } from "@mui/material";
import { apiFetch } from "@/lib/api/apiFetch";
import { StatusAlert } from "@/components/ui/StatusAlert";
import type { ProgressGoal } from "@/lib/types/types";

interface GoalApiResponse {
  ok: boolean;
  goals?: ProgressGoal[];
  latestEnd?: number;
  error?: string;
}

interface Props {
  /** Called after goal data is fetched or saved so parent can derive summary metrics. */
  onGoalData?: (targetAmount: number | null, latestEnd: number | null) => void;
  /**
   * Increment this value to force a re-fetch of goal data. Used by the page
   * after retirement entry mutations so latestEnd stays current.
   */
  refreshTrigger?: number;
  /** Called after a successful save. */
  onSaved?: () => void;
}

export default function GoalEditor({
  onGoalData,
  refreshTrigger,
  onSaved,
}: Props) {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);

  const fetchGoal = useCallback(async () => {
    try {
      const res = await apiFetch("/api/progress/goal");
      const data = (await res.json()) as GoalApiResponse;
      if (data.ok) {
        const primaryGoal = data.goals?.[0] ?? null;
        const resolvedLatestEnd = data.latestEnd ?? null;
        setGoalId(primaryGoal?.goalId ?? undefined);
        setTarget(String(primaryGoal?.targetAmount ?? ""));
        onGoalData?.(primaryGoal?.targetAmount ?? null, resolvedLatestEnd);
      }
    } catch {
      /* ignore */
    }
  }, [onGoalData]);

  useEffect(() => {
    void fetchGoal();
  }, [fetchGoal, refreshTrigger]);

  const save = async () => {
    if (!target) return;
    setLoading(true);
    setSaveError(null);
    try {
      const body: { targetAmount: number; goalId?: string } = {
        targetAmount: Number(target),
      };
      if (goalId) body.goalId = goalId;
      const method = goalId ? "PUT" : "POST";
      const res = await apiFetch("/api/progress/goal", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      await fetchGoal();
      onSaved?.();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save goal",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void save();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
      <Stack spacing={2}>
        {saveError && (
          <StatusAlert message={saveError} onClose={() => setSaveError(null)} />
        )}
        <TextField
          label="Target Amount"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          type="number"
          required
          autoFocus
        />
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !target}
          >
            Save
          </Button>
          <Button variant="outlined" onClick={onSaved}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
