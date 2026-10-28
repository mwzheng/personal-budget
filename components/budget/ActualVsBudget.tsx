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
import { alpha } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { SavedBudget, Transaction } from "@/lib/types/types";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/cognitoClient";
import { currentTransactionScope } from "@/lib/auth/accountScope";
import {
  calculateBudgetComparison,
  type ComparisonRow,
} from "@/lib/budget/comparison";
import { loadMonthlyTransactions } from "@/lib/budget/loadMonthlyTransactions";
import { normalizeBudgetForEditor } from "@/lib/utils/budget-normalizer";
import { apiFetch } from "@/lib/api/apiFetch";
import { CATEGORY_COLORS, sortSavedBudgets } from "@/lib/utils/budget-planner";
import { formatCurrency } from "@/lib/utils/format";
import HeaderInfo from "@/components/ui/HeaderInfo";

function monthStart(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function monthPeriod(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return null;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}
function ComparisonLine({
  label,
  value,
  saving = false,
  barColor,
}: {
  label: string;
  value: ComparisonRow;
  saving?: boolean;
  barColor?: string;
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
  const isOver = value.status === "over" || value.status === "unbudgeted";
  const color = isOver ? "error" : saving ? "success" : "primary";
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
        sx={{
          height: 8,
          borderRadius: 1,
          ...(barColor && {
            bgcolor: alpha(barColor, 0.14),
            "& .MuiLinearProgress-bar": { bgcolor: barColor },
          }),
        }}
      />
      <Typography
        variant="body2"
        color={
          isOver
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

export function ActualVsBudget() {
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetRefresh, setBudgetRefresh] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(monthStart);
  const month = monthPeriod(selectedMonth);
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
    () => sortSavedBudgets(savedBudgets.filter((budget) => budget.budgetId)),
    [savedBudgets],
  );
  const selectedSavedBudget = budgets.find(
    (budget) => budget.budgetId === activeBudgetId,
  );
  const selectedBudget = selectedSavedBudget
    ? normalizeBudgetForEditor(selectedSavedBudget)
    : null;
  const hasBudget = Boolean(selectedBudget);

  useEffect(() => {
    const sync = () => {
      const next = currentTransactionScope();
      if (scopeRef.current !== next) {
        scopeRef.current = next;
        generation.current += 1;
        setLoad(null);
        setSavedBudgets([]);
        setActiveBudgetId(null);
        setBudgetError(null);
        setSelectedMonth(monthStart());
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
    if (!scope) return;
    const controller = new AbortController();
    setBudgetLoading(true);
    setBudgetError(null);
    setSavedBudgets([]);
    setActiveBudgetId(null);
    apiFetch("/api/budgets", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data?.error?.message ?? "Failed to load saved budgets.",
          );
        return Array.isArray(data) ? data : (data?.budgets ?? []);
      })
      .then((data: SavedBudget[]) => {
        if (controller.signal.aborted || currentTransactionScope() !== scope)
          return;
        const sorted = sortSavedBudgets(
          data.filter((budget) => budget.budgetId),
        );
        setSavedBudgets(sorted);
        setActiveBudgetId(sorted[0]?.budgetId ?? null);
        setBudgetLoading(false);
      })
      .catch((error) => {
        if (controller.signal.aborted || currentTransactionScope() !== scope)
          return;
        setBudgetError(
          error instanceof Error
            ? error.message
            : "Failed to load saved budgets.",
        );
        setBudgetLoading(false);
      });
    return () => controller.abort();
  }, [scope, budgetRefresh]);
  useEffect(() => {
    const request = ++generation.current;
    const controller = new AbortController();
    setLoad(null);
    if (!scope || !hasBudget || !month) return () => controller.abort();
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
    month && selectedBudget && currentLoad?.transactions
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box />
        <Typography id="actual-budget-heading" variant="h5" textAlign="center">
          Actual vs Budget
        </Typography>
        <Box>
          <HeaderInfo
            title="Actual vs Budget"
            description="Uses saved budget amounts and recorded transactions."
          />
        </Box>
      </Box>
      {budgetLoading && scope ? (
        <Box role="status">
          <LinearProgress />
          <Typography mt={1}>Loading saved budgets…</Typography>
        </Box>
      ) : budgetError ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              onClick={() => setBudgetRefresh((value) => value + 1)}
            >
              Retry
            </Button>
          }
        >
          {budgetError}
        </Alert>
      ) : !scope ? (
        <Typography color="text.secondary">
          Sign in to load saved budgets.
        </Typography>
      ) : !selectedBudget ? (
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
              value={activeBudgetId}
              onChange={(event) => {
                const budget = budgets.find(
                  (candidate) => candidate.budgetId === event.target.value,
                );
                if (budget) setActiveBudgetId(budget.budgetId ?? null);
              }}
              size="small"
              sx={{ flex: 1, minWidth: 0 }}
            >
              {budgets.map((budget) => (
                <MenuItem key={budget.budgetId} value={budget.budgetId}>
                  {budget.name}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label="Month"
              views={["year", "month"]}
              openTo="month"
              format="MMMM yyyy"
              value={selectedMonth}
              onChange={(value) => {
                setSelectedMonth(value ? monthStart(value) : null);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: { xs: 0, sm: 190 } },
                },
              }}
            />
          </Stack>
          {month === monthPeriod(monthStart()) && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              Month to date against full monthly budget.
            </Typography>
          )}
          {comparison && comparison.excludedPlannedAmount > 0 && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              Excludes {formatCurrency(comparison.excludedPlannedAmount)} of
              budget items marked not to compare.
            </Typography>
          )}
          {!month ? (
            <Alert severity="info">Choose a valid month and year.</Alert>
          ) : !scope ? (
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
                barColor={CATEGORY_COLORS.Need}
              />
              <ComparisonLine
                label="Wants"
                value={comparison.categories.Want}
                barColor={CATEGORY_COLORS.Want}
              />
              <ComparisonLine
                label="Savings"
                value={comparison.categories.Saving}
                saving
                barColor={CATEGORY_COLORS.Saving}
              />
            </Stack>
          )}
        </>
      )}
    </Paper>
  );
}
