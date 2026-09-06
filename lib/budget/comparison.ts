import type { CategoryType, SavedBudget, Transaction } from "@/lib/types/types";
import { buildBudgetInsights } from "@/lib/utils/budget-calculator";
import { normalizeBudgetForEditor } from "@/lib/utils/budget-normalizer";
import { normalizeTransactionCategory } from "@/lib/utils/transaction-categories";

export function monthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Choose a valid month.");
  const [year, index] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return { startDate: `${month}-01`, endDate: `${month}-${lastDay}` };
}

function cents(amount: number) {
  return Number.isFinite(amount)
    ? Math.round((amount + Number.EPSILON) * 100)
    : 0;
}
export interface ComparisonRow {
  planned: number;
  actual: number;
  difference: number;
  status:
    | "remaining"
    | "over"
    | "unbudgeted"
    | "needed"
    | "above-target"
    | "no-target";
  progress: number;
}
function row(planned: number, actual: number, saving = false): ComparisonRow {
  return {
    planned: planned / 100,
    actual: actual / 100,
    difference: (planned - actual) / 100,
    status: saving
      ? planned === 0
        ? "no-target"
        : actual >= planned
          ? "above-target"
          : "needed"
      : planned === 0 && actual > 0
        ? "unbudgeted"
        : actual > planned
          ? "over"
          : "remaining",
    progress:
      planned > 0
        ? Math.max(0, Math.min(100, (actual / planned) * 100))
        : actual > 0
          ? 100
          : 0,
  };
}
export function calculateBudgetComparison(
  budget: SavedBudget,
  transactions: Transaction[],
  month: string,
) {
  const bounds = monthBounds(month);
  const actual: Record<CategoryType, number> = { Need: 0, Want: 0, Saving: 0 };
  const normalizedBudget = normalizeBudgetForEditor(budget);
  const insights = buildBudgetInsights(normalizedBudget);
  const excluded: Record<CategoryType, number> = {
    Need: 0,
    Want: 0,
    Saving: 0,
  };
  for (const expense of normalizedBudget.expenses) {
    if (expense.includeInActualComparison === false) {
      excluded[expense.category] += cents(expense.amount);
    }
  }
  const planned: Record<CategoryType, number> = {
    Need: Math.max(0, cents(insights.categoryTotals.Need) - excluded.Need),
    Want: Math.max(0, cents(insights.categoryTotals.Want) - excluded.Want),
    Saving: Math.max(
      0,
      cents(insights.categoryTotals.Saving) - excluded.Saving,
    ),
  };

  const monthly = transactions.filter(
    (tx) => tx.date >= bounds.startDate && tx.date <= bounds.endDate,
  );
  for (const tx of monthly) {
    const category = normalizeTransactionCategory(tx.category);
    if (category !== "Income") actual[category] += cents(tx.amount);
  }
  return {
    transactionCount: monthly.length,
    excludedPlannedAmount:
      (excluded.Need + excluded.Want + excluded.Saving) / 100,
    spending: row(planned.Need + planned.Want, actual.Need + actual.Want),
    categories: {
      Need: row(planned.Need, actual.Need),
      Want: row(planned.Want, actual.Want),
      Saving: row(planned.Saving, actual.Saving, true),
    },
  };
}
