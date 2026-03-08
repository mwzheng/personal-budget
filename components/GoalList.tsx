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
import GoalForm from "./GoalForm";

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

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSaved = (g: any) => {
    setShowForm(false);
    setEditing(null);
    fetchGoals();
  };

  const handleDelete = async (goalId?: string) => {
    if (!goalId) return;
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

      {error && <Box sx={{ color: "error.main", mb: 2 }}>{error}</Box>}

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
