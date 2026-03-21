/**
 * Note 1: BudgetList stays intentionally thin: it fetches the user's saved
 * budgets, handles deletion, and delegates the actual load/edit behavior back to
 * the page. That keeps persistence concerns here while the page owns the draft.
 */
"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@mui/material/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusAlert } from "@/components/ui/StatusAlert";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api/apiFetch";
import {
  normalizeBudgetForEditor,
  sortSavedBudgets,
} from "@/lib/utils/budget-planner";
import { SavedBudget } from "@/lib/types/types";

interface Props {
  onLoad?: (budget: SavedBudget) => void;
  onEdit?: (budget: SavedBudget) => void;
  onBudgetsLoaded?: (budgets: SavedBudget[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  reloadKey?: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function BudgetList({
  onLoad,
  onEdit,
  onBudgetsLoaded,
  onLoadingChange,
  reloadKey,
}: Props) {
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {
      const response = await apiFetch("/api/budgets");
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(
          data?.error?.message ?? data?.error ?? response.statusText,
        );
      }

      const nextBudgets = Array.isArray(data) ? data : (data?.budgets ?? []);
      const sortedBudgets = sortSavedBudgets(
        Array.isArray(nextBudgets) ? (nextBudgets as SavedBudget[]) : [],
      );

      setBudgets(sortedBudgets);
      onBudgetsLoaded?.(sortedBudgets);
    } catch (caughtError) {
      setBudgets([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load saved budgets.",
      );
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onBudgetsLoaded, onLoadingChange]);

  useEffect(() => {
    void loadBudgets();
    // Note 2: `reloadKey` gives the parent an imperative "refresh now" hook
    // without forcing this component to know why the list changed.
  }, [loadBudgets, reloadKey]);

  async function confirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      const response = await apiFetch(`/api/budgets/${deleteCandidate.id}`, {
        method: "DELETE",
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.error?.message ?? data?.error ?? "Delete failed");
      }

      setBudgets((current) => {
        const nextBudgets = current.filter(
          (budget) => budget.budgetId !== deleteCandidate.id,
        );
        onBudgetsLoaded?.(nextBudgets);
        return nextBudgets;
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete budget.",
      );
    } finally {
      setDeleteCandidate(null);
    }
  }

  return (
    <div>
      {error ? (
        <StatusAlert message={error} onClose={() => setError(null)} />
      ) : null}

      <List dense disablePadding>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading budgets...
          </Typography>
        ) : null}

        {!loading && budgets.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Save a budget to reuse the same expense plan later.
          </Typography>
        ) : null}

        {budgets.map((budget) => {
          const normalized = normalizeBudgetForEditor(budget);
          const expenseCount = normalized.expenses.filter(
            (expense) => expense.name.trim() && expense.amount > 0,
          ).length;

          return (
            <ListItem key={budget.budgetId ?? budget.name} disableGutters>
              <ListItemButton onClick={() => onLoad?.(budget)}>
                <ListItemText
                  primary={budget.name}
                  secondary={`${formatCurrency(normalized.monthlyIncome)} income - ${expenseCount} expense${expenseCount === 1 ? "" : "s"}`}
                />
              </ListItemButton>
              <ListItemSecondaryAction>
                <Button size="small" onClick={() => onLoad?.(budget)}>
                  Load
                </Button>
                <Button size="small" onClick={() => onEdit?.(budget)}>
                  Edit
                </Button>
                <IconButton
                  edge="end"
                  onClick={() =>
                    setDeleteCandidate({
                      id: budget.budgetId ?? "",
                      name: budget.name,
                    })
                  }
                  aria-label={`delete-${budget.budgetId}`}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Budget"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
