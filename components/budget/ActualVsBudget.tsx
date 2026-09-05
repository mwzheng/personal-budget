"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SavedBudget, Transaction } from "@/lib/types/types";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/cognitoClient";
import { currentTransactionScope } from "@/lib/auth/accountScope";
import {
  calculateBudgetComparison,
  type ComparisonRow,
} from "@/lib/budget/comparison";
import { loadMonthlyTransactions } from "@/lib/budget/loadMonthlyTransactions";
import { formatCurrency } from "@/lib/utils/format";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function ComparisonLine({
  label,
  value,
  saving = false,
}: {
  label: string;
  value: ComparisonRow;
  saving?: boolean;
}) {
  const amount = formatCurrency(Math.abs(value.difference));
  const description = {
    remaining: `${amount} remaining`,
    over: `${amount} over`,
    unbudgeted: `Unbudgeted · ${formatCurrency(value.actual)} over`,
    needed: `${amount} still needed`,
    "above-target": `${amount} above target`,
    "no-target": "No target set",
  }[value.status];
  const color =
    value.status === "over" || value.status === "unbudgeted"
      ? "error"
      : saving
        ? "success"
        : "primary";
  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={0.5}
        mb={0.75}
      >
        <Typography fontWeight={600}>{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {saving ? "Target" : "Budgeted"}: {formatCurrency(value.planned)} ·{" "}
          {saving ? "Recorded savings" : "Actual"}:{" "}
          {formatCurrency(value.actual)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value.progress}
        color={color}
        aria-label={`${label} progress`}
        sx={{ height: 8, borderRadius: 1 }}
      />
      <Typography
        variant="body2"
        color={
          color === "error"
            ? "error.main"
            : saving && value.status === "above-target"
              ? "success.main"
              : "text.secondary"
        }
        mt={0.75}
      >
        {description}
      </Typography>
    </Box>
  );
}

export function ActualVsBudget({
  savedBudgets,
  preferredBudgetId,
}: {
  savedBudgets: SavedBudget[];
  preferredBudgetId: string | null;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [explicitBudgetId, setExplicitBudgetId] = useState<string | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [load, setLoad] = useState<{
    scope: string | null;
    month: string;
    transactions?: Transaction[];
    error?: string;
  } | null>(null);
  const generation = useRef(0);
  const scopeRef = useRef<string | null>(null);
  const budgets = useMemo(
    () =>
      [...savedBudgets]
        .filter((budget) => budget.budgetId)
        .sort((a, b) =>
          (b.updatedAt ?? b.createdAt ?? "").localeCompare(
            a.updatedAt ?? a.createdAt ?? "",
          ),
        ),
    [savedBudgets],
  );
  const defaultBudget =
    budgets.find((budget) => budget.budgetId === preferredBudgetId) ??
    budgets[0];
  const selectedBudget =
    budgets.find((budget) => budget.budgetId === explicitBudgetId) ??
    defaultBudget;
  const hasBudget = Boolean(selectedBudget);

  useEffect(() => {
    if (
      explicitBudgetId &&
      !budgets.some((budget) => budget.budgetId === explicitBudgetId)
    ) {
      // Keep an editor selection as the default. Only an explicit comparison
      // selection is cleared when its saved budget is deleted.
      setExplicitBudgetId(null);
    }
  }, [budgets, explicitBudgetId]);
  useEffect(() => {
    const sync = () => {
      const next = currentTransactionScope();
      if (scopeRef.current !== next) {
        scopeRef.current = next;
        generation.current += 1;
        setLoad(null);
        setExplicitBudgetId(null);
        setMonth(currentMonth());
        setScope(next);
      }
    };
    const focus = () => {
      sync();
      setRefresh((value) => value + 1);
    };
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", focus);
    };
  }, []);
  useEffect(() => {
    const request = ++generation.current;
    const controller = new AbortController();
    setLoad(null);
    if (!scope || !hasBudget) return () => controller.abort();
    loadMonthlyTransactions(month, controller.signal)
      .then((transactions) => {
        if (
          !controller.signal.aborted &&
          request === generation.current &&
          currentTransactionScope() === scope
        ) {
          setLoad({ scope, month, transactions });
        }
      })
      .catch((error) => {
        if (
          !controller.signal.aborted &&
          request === generation.current &&
          currentTransactionScope() === scope
        ) {
          setLoad({
            scope,
            month,
            error:
              error instanceof Error
                ? error.message
                : "Could not load transactions.",
          });
        }
      });
    return () => controller.abort();
  }, [scope, month, refresh, hasBudget]);

  const currentLoad =
    load?.scope === scope && load.month === month ? load : null;
  const comparison =
    selectedBudget && currentLoad?.transactions
      ? calculateBudgetComparison(
          selectedBudget,
          currentLoad.transactions,
          month,
        )
      : null;
  return (
    <Paper
      component="section"
      aria-labelledby="actual-budget-heading"
      sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}
    >
      <Typography id="actual-budget-heading" variant="h5" mb={1}>
        Actual vs budget
      </Typography>
      <Typography color="text.secondary" variant="body2" mb={2}>
        Uses saved budget amounts and recorded transactions.
      </Typography>
      {!selectedBudget ? (
        <Typography color="text.secondary">
          Save your first budget to compare recorded activity with your monthly
          plan.
        </Typography>
      ) : (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
            <TextField
              select
              label="Saved budget"
              value={selectedBudget.budgetId}
              onChange={(event) => setExplicitBudgetId(event.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 0 }}
            >
              {budgets.map((budget) => (
                <MenuItem key={budget.budgetId} value={budget.budgetId}>
                  {budget.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Month"
              type="month"
              value={month}
              onChange={(event) => {
                if (/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value))
                  setMonth(event.target.value);
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          {month === currentMonth() && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              Month to date against full monthly budget.
            </Typography>
          )}
          {!scope ? (
            <Typography color="text.secondary">
              Sign in to load recorded transactions.
            </Typography>
          ) : currentLoad?.error ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  onClick={() => setRefresh((value) => value + 1)}
                >
                  Retry
                </Button>
              }
            >
              {currentLoad.error}
            </Alert>
          ) : !comparison ? (
            <Box role="status">
              <LinearProgress />
              <Typography variant="body2" mt={1}>
                Loading monthly transactions…
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {comparison.transactionCount === 0 && (
                <Alert severity="info">
                  No transactions recorded this month.
                </Alert>
              )}
              <ComparisonLine
                label="Total spending"
                value={comparison.spending}
              />
              <Box sx={{ borderTop: 1, borderColor: "divider" }} />
              <ComparisonLine
                label="Needs"
                value={comparison.categories.Need}
              />
              <ComparisonLine
                label="Wants"
                value={comparison.categories.Want}
              />
              <ComparisonLine
                label="Savings"
                value={comparison.categories.Saving}
                saving
              />
            </Stack>
          )}
        </>
      )}
    </Paper>
  );
}
