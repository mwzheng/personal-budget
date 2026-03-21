// Note 1: GoalList is an "orchestrator" component -- it owns all network calls
// (fetch, delete) and passes data down to GoalForm. This keeps network logic
// in one place and lets GoalForm remain a pure controlled form.
"use client";
import React, { useEffect, useState } from "react";
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
import { StatusAlert } from "@/components/ui/StatusAlert";
import { apiFetch } from "@/lib/api/apiFetch";

// Note 2: The local `Goal` type mirrors the server response shape. Having a
// local type decouples GoalList from the shared `lib/types` Goal interface,
// allowing the server to add computed fields (like `eta`) that the shared type
// may not include.
type Goal = {
  goalId?: string;
  name: string;
  targetAmount: number;
  currentSaved?: number;
  monthlyContribution?: number;
  expectedAnnualReturn?: number;
  eta?: { months: number; projectedDate: string | null } | null;
};

export default function GoalList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/goals");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load goals");
      setGoals(data.goals ?? []);
    } catch (err: any) {
      setError(err.message || String(err));
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

  const handleDelete = async (goalId?: string) => {
    if (!goalId) return;
    // Note 5: The native `confirm()` dialog is a simple way to require user
    // confirmation before a destructive action. For a more polished UX, this
    // could be replaced with a MUI Dialog (as in TransactionsTable).
    if (!confirm("Delete this goal?")) return;
    try {
      const res = await apiFetch(
        "/api/goals?goalId=" + encodeURIComponent(goalId),
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");
      fetchGoals();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Goals</Typography>
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
        {goals.map((g) => (
          <React.Fragment key={g.goalId}>
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(g);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(g.goalId)}
                  >
                    Delete
                  </Button>
                </Stack>
              }
            >
              <ListItemText
                primary={`${g.name} — $${Number(g.currentSaved ?? 0).toLocaleString()} / $${Number(g.targetAmount).toLocaleString()}`}
                secondary={
                  // Note 6: `eta.months === Infinity` occurs when the monthly
                  // contribution is zero (or the goal can never be reached). The
                  // UI shows "—" instead of "Infinity months" to avoid confusing
                  // the user. This mirrors the same guard in `lib/goals.ts`.
                  g.eta
                    ? `ETA: ${g.eta.months === Infinity ? "—" : g.eta.months + " months"}${g.eta.projectedDate ? " (" + new Date(g.eta.projectedDate).toLocaleDateString() + ")" : ""}`
                    : ""
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      {goals.length === 0 && !loading && <Typography>No goals yet.</Typography>}
    </Box>
  );
}
