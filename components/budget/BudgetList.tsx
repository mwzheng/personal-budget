"use client";

/**
 * Saved-budget controls live beside the editor they affect. Keeping the fetch,
 * export, and delete concerns here lets BudgetForm stay focused on draft rows
 * while making the currently edited saved budget explicit.
 */
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { apiFetch } from "@/lib/api/apiFetch";
import {
  downloadBudgetCsv,
  downloadBudgetJson,
} from "@/lib/utils/budgetExport";
import { sortSavedBudgets } from "@/lib/utils/budget-planner";
import { SavedBudget } from "@/lib/types/types";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  activeBudgetId: string | null;
  onEdit: (budget: SavedBudget) => void;
  onBudgetsLoaded?: (budgets: SavedBudget[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onDeleted: (budgetId: string) => void;
  reloadKey?: number;
}

function getUsableBudgetId(budget: SavedBudget): string | null {
  const budgetId = budget.budgetId?.trim();
  return budgetId || null;
}

export function BudgetList({
  activeBudgetId,
  onEdit,
  onBudgetsLoaded,
  onLoadingChange,
  onDeleted,
  reloadKey,
}: Props) {
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);

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
  }, [loadBudgets, reloadKey]);

  const activeBudget = useMemo(
    () =>
      activeBudgetId
        ? (budgets.find(
            (budget) => getUsableBudgetId(budget) === activeBudgetId,
          ) ?? null)
        : null,
    [activeBudgetId, budgets],
  );
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
        onDeleted(item.id);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to delete budget.",
        );
      }
    },
  });

  function handleExport(format: "json" | "csv") {
    if (!activeBudget) return;
    setExportAnchor(null);
    if (format === "json") {
      downloadBudgetJson(activeBudget);
    } else {
      downloadBudgetCsv(activeBudget);
    }
  }

  return (
    <Stack spacing={1.25}>
      {error ? (
        <StatusAlert
          message={error}
          onClose={() => setError(null)}
          sx={{ mb: 0 }}
        />
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <TextField
          select
          label="Saved budget"
          value={activeBudgetId ?? ""}
          onChange={(event) => {
            const selected = budgets.find(
              (budget) => budget.budgetId === event.target.value,
            );
            if (selected) onEdit(selected);
          }}
          disabled={loading}
          size="small"
          sx={{ minWidth: { sm: 260 }, flex: 1 }}
          helperText={
            loading
              ? "Loading saved budgets…"
              : activeBudget
                ? `Editing saved budget: ${activeBudget.name}`
                : "New budget draft — save it to add it here."
          }
          slotProps={{
            inputLabel: { shrink: true },
            select: { displayEmpty: true },
          }}
        >
          <MenuItem value="" disabled>
            <em>New budget draft</em>
          </MenuItem>
          {budgets.map((budget, index) => {
            const budgetId = getUsableBudgetId(budget);
            return (
              <MenuItem
                key={budgetId ?? `${budget.name}-legacy-${index}`}
                value={budgetId ?? ""}
                disabled={!budgetId}
              >
                {budget.name}
                {!budgetId ? " (legacy record — unavailable)" : ""}
              </MenuItem>
            );
          })}
        </TextField>

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignSelf: { xs: "flex-end", sm: "flex-start" } }}
        >
          <Button
            size="small"
            variant="outlined"
            endIcon={
              loading ? (
                <CircularProgress size={14} />
              ) : (
                <MoreVertOutlinedIcon />
              )
            }
            disabled={!activeBudget || loading}
            onClick={(event) => setExportAnchor(event.currentTarget)}
            sx={{ height: 36, whiteSpace: "nowrap" }}
          >
            Export
          </Button>
          <ActionIconButton
            tooltip="Delete active saved budget"
            ariaLabel={
              activeBudget
                ? `Delete saved budget ${activeBudget.name}`
                : "Delete active saved budget"
            }
            tone="danger"
            disabled={!activeBudget || loading}
            onClick={() => {
              const budgetId = activeBudget && getUsableBudgetId(activeBudget);
              if (budgetId && activeBudget) {
                requestDelete({ id: budgetId, name: activeBudget.name });
              }
            }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ActionIconButton>
        </Stack>
      </Stack>

      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={() => handleExport("json")}>
          JSON (importable)
        </MenuItem>
        <MenuItem onClick={() => handleExport("csv")}>
          CSV (view in spreadsheet)
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Budget"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}
