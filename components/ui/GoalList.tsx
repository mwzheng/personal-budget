// Note 1: GoalList is an "orchestrator" component -- it owns all network calls
// (fetch, delete) and passes data down to GoalForm. This keeps network logic
// in one place and lets GoalForm remain a pure controlled form.
"use client";
import React, { useEffect, useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import GoalForm from "@/components/forms/GoalForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { apiFetch } from "@/lib/api/apiFetch";
import type { Goal } from "@/lib/types/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function GoalList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    candidate: deleteCandidate,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting,
  } = useDeleteConfirmation<string>({
    onConfirm: async (goalId) => {
      try {
        const res = await apiFetch(
          "/api/goals?goalId=" + encodeURIComponent(goalId),
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Delete failed");
        fetchGoals();
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    },
  });

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/goals");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load goals");
      setGoals(data.goals ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Note 3: The empty dependency array `[]` means this effect runs once after
  // the initial render, equivalent to `componentDidMount` in class components.
  // It is the standard way to trigger a data fetch when a component first mounts.
  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    // Note 4: Re-fetching the full list from the server after a save ensures the
    // UI shows the latest data including server-computed fields like `eta`, rather
    // than relying on a stale local copy.
    fetchGoals();
  };

  // Note 5: Delete is a two-step flow: the button sets the candidate goalId,
  // and the hook's confirmDelete performs the actual API call only after the
  // user confirms via the ConfirmDialog.

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Goals</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          New Goal
        </Button>
      </Stack>

      {showForm && (
        <Box sx={{ mb: 2 }}>
          <GoalForm
            defaultGoal={editing || undefined}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </Box>
      )}

      {error && <StatusAlert message={error} onClose={() => setError(null)} />}

      <List>
        {goals.map((g, index) => (
          <React.Fragment key={g.goalId ?? `goal-${index}`}>
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={0.75}>
                  <ActionIconButton
                    tooltip="Edit"
                    ariaLabel={`Edit goal ${g.name}`}
                    onClick={() => {
                      setEditing(g);
                      setShowForm(true);
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </ActionIconButton>
                  <ActionIconButton
                    tooltip="Delete"
                    ariaLabel={`Delete goal ${g.name}`}
                    tone="danger"
                    onClick={() => requestDelete(g.goalId ?? "")}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </ActionIconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={`${g.name} — $${Number(g.currentSaved ?? 0).toLocaleString()} / $${Number(g.targetAmount).toLocaleString()}`}
                secondary={
                  // Note 6: Unreachable goals come back as `eta.months = null`
                  // because JSON transport cannot preserve `Infinity`. The UI
                  // still renders the same em dash fallback so users do not see
                  // a misleading or implementation-specific value.
                  g.eta
                    ? `ETA: ${g.eta.months == null ? "—" : g.eta.months + " months"}${g.eta.projectedDate ? " (" + new Date(g.eta.projectedDate).toLocaleDateString() + ")" : ""}`
                    : ""
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      {goals.length === 0 && !loading && <EmptyState message="No goals yet." />}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
