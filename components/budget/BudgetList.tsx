/**
 * Note 1: BudgetList stays intentionally thin: it fetches the user's saved
 * budgets, handles deletion, and delegates the actual load/edit behavior back to
 * the page. That keeps persistence concerns here while the page owns the draft.
 */
"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { StatusAlert } from "@/components/ui/StatusAlert";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { apiFetch } from "@/lib/api/apiFetch";
import {
  normalizeBudgetForEditor,
  sortSavedBudgets,
} from "@/lib/utils/budget-planner";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { SavedBudget } from "@/lib/types/types";

interface Props {
  onLoad?: (budget: SavedBudget) => void;
  onEdit?: (budget: SavedBudget) => void;
  onBudgetsLoaded?: (budgets: SavedBudget[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  reloadKey?: number;
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
  const {
    candidate: deleteCandidate,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting,
  } = useDeleteConfirmation<{ id: string; name: string }>({
    onConfirm: async (item) => {
      try {
        const response = await apiFetch(`/api/budgets/${item.id}`, {
          method: "DELETE",
        });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
          throw new Error(
            data?.error?.message ?? data?.error ?? "Delete failed",
          );
        }

        setBudgets((current) => {
          const nextBudgets = current.filter(
            (budget) => budget.budgetId !== item.id,
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
      }
    },
  });

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
          <EmptyState
            message="Save a budget to reuse the same expense plan later."
            variant="body2"
          />
        ) : null}

        {budgets.map((budget) => {
          const normalized = normalizeBudgetForEditor(budget);
          const expenseCount = normalized.expenses.filter(
            (expense) => expense.name.trim() && expense.amount > 0,
          ).length;

          return (
            <ListItem
              key={budget.budgetId ?? budget.name}
              disableGutters
              disablePadding
            >
              {/* Note 3: The row itself is now the load affordance, so the hover
                  hint replaces a duplicate "Load" button without hiding how to
                  reopen a saved budget. */}
              <Tooltip
                title="Click this row to load the budget"
                placement="top"
                arrow
                disableHoverListener={!onLoad}
              >
                <ListItemButton
                  onClick={() => onLoad?.(budget)}
                  aria-label={`Load budget ${budget.name}`}
                  sx={{ pr: 1, gap: 1 }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ListItemText
                      primary={budget.name}
                      secondary={`${formatCurrencyWhole(normalized.monthlyIncome)} income - ${expenseCount} expense${expenseCount === 1 ? "" : "s"}`}
                    />
                  </Box>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ ml: 1, flexShrink: 0 }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {onEdit ? (
                      <ActionIconButton
                        tooltip="Edit"
                        ariaLabel={`Edit budget ${budget.name}`}
                        onClick={() => {
                          onEdit?.(budget);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </ActionIconButton>
                    ) : null}
                    <ActionIconButton
                      tooltip="Delete"
                      ariaLabel={`Delete budget ${budget.name}`}
                      tone="danger"
                      onClick={() =>
                        requestDelete({
                          id: budget.budgetId ?? "",
                          name: budget.name,
                        })
                      }
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </ActionIconButton>
                  </Stack>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Budget"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
