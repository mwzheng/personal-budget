/**
 * Note 1: GoalEditor – displays the user's savings/progress goal with a
 * determinate progress bar and an edit-via-dialog workflow.
 *
 * - The inline TextField + Save button has been replaced by a LinearProgress
 *   bar and a popup dialog (ProgressEntryDialog) for editing the target.
 * - All API logic (fetch + save) is unchanged so the component remains a
 *   drop-in replacement.
 * - An "empty state" is shown when no goal has been created yet, prompting
 *   the user to set one.
 */
"use client";

import React, { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { SectionHeader } from "@/components/progress/SectionHeader";
import { ProgressEntryDialog } from "@/components/progress/ProgressEntryDialog";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { apiFetch } from "@/lib/api/apiFetch";
import type { ProgressGoal } from "@/lib/types/types";

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
  const [dialogOpen, setDialogOpen] = useState(false);

  // Note 3: fetchGoal is wrapped in useCallback so it can be referenced in
  // both the initial useEffect and after a successful save without triggering
  // lint warnings about stale closures.
  const fetchGoal = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void fetchGoal();
  }, [fetchGoal]);

  // Note 4: save() is unchanged from the original implementation —
  // POST for new goals, PUT for existing ones.
  const save = async () => {
    if (!target) return;
    setLoading(true);
    try {
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
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void save();
  };

  const openDialog = () => {
    // Note 5: Pre-populate the text field with the existing target so the user
    // sees their current value when the dialog opens.
    setTarget(String(goal?.targetAmount ?? ""));
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  // Note 6: Percentage is clamped to 0–100 for the LinearProgress bar but the
  // displayed text shows the raw value so the user can see if they exceeded
  // their goal (e.g. 105%).
  const rawPct =
    goal && latestEnd !== null
      ? Math.round((latestEnd / goal.targetAmount) * 10000) / 100
      : null;
  const clampedPct = rawPct !== null ? Math.min(Math.max(rawPct, 0), 100) : 0;

  // Note 7: Shared currency formatter keeps display consistent and avoids
  // repeating the `$…toLocaleString()` pattern in multiple places.
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <Box>
      {/* ---- Header with optional edit button ---- */}
      <SectionHeader
        title="Progress Goal"
        action={
          goal ? (
            <ActionIconButton tooltip="Edit goal" onClick={openDialog}>
              <EditOutlinedIcon fontSize="small" />
            </ActionIconButton>
          ) : undefined
        }
        sx={{ mb: 1.5 }}
      />

      {goal ? (
        // Note 8: "Active goal" state — progress bar + amounts.
        <Stack spacing={2}>
          {/* Amounts row */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Progress
              </Typography>
              <Typography variant="h6" fontWeight={600} color="success.main">
                {latestEnd !== null ? fmt(latestEnd) : "N/A"}
              </Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                Target
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {fmt(goal.targetAmount)}
              </Typography>
            </Box>
          </Stack>

          {/* Progress bar + percentage */}
          <Stack spacing={0.5}>
            <LinearProgress
              variant="determinate"
              value={clampedPct}
              sx={{
                height: 8,
                borderRadius: 4,
              }}
            />
            {rawPct !== null && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="right"
              >
                {rawPct}%
              </Typography>
            )}
          </Stack>
        </Stack>
      ) : (
        // Note 9: Empty state — shown when no goal has been created yet.
        // A friendly message plus a CTA button to open the goal dialog.
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">
            You haven&apos;t set a progress goal yet. Define a target amount to
            start tracking your savings!
          </Typography>
          <Button variant="contained" onClick={openDialog}>
            Set Goal
          </Button>
        </Stack>
      )}

      {/* ---- Edit / Create dialog ---- */}
      <ProgressEntryDialog
        open={dialogOpen}
        title={goal ? "Edit Progress Goal" : "Set Progress Goal"}
        onClose={closeDialog}
      >
        {/* Note 10: The dialog body follows the project's form pattern —
            a constrained-width Box with a Stack of fields and action buttons.
            The form uses the native submit event so Enter key works. */}
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
          <Stack spacing={2}>
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
              <Button variant="outlined" onClick={closeDialog}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </ProgressEntryDialog>
    </Box>
  );
}
