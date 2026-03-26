/**
 * Note 1: Core budget math and the top-level `buildBudgetInsights` orchestrator.
 * This is the highest layer in the budget utility stack:
 *
 *   budget-normalizer  (no internal deps)
 *        ↑
 *   sankey-builder     (imports from budget-normalizer)
 *        ↑
 *   budget-calculator  (imports from both)
 *
 * Keeping this separation means sankey-builder and budget-normalizer can be
 * imported independently (e.g., by tests or alternative UI paths) without
 * pulling in the full insight-calculation pipeline.
 */
import {
  BudgetExpense,
  CategoryType,
  SankeyData,
  SavedBudget,
} from "../types/types";
import { BudgetDraft, normalizeBudgetExpenses } from "./budget-normalizer";
import {
  BudgetPieSlice,
  buildPieData,
  buildSankeyData,
} from "./sankey-builder";

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

/** Canonical sort order for the three budget categories. */
export const CATEGORY_ORDER: CategoryType[] = ["Need", "Want", "Saving"];

/** Human-readable display labels for each category (e.g. in chart legends). */
export const CATEGORY_LABELS: Record<CategoryType, string> = {
  Need: "Needs",
  Want: "Wants",
  Saving: "Savings",
};

// ---------------------------------------------------------------------------
// Exported type
// ---------------------------------------------------------------------------

/**
 * All derived values computed from a single BudgetDraft snapshot.
 * Returned by `buildBudgetInsights` and consumed by the Sankey page and
 * its child components.
 */
export interface BudgetInsights {
  monthlyIncome: number;
  totalExpenses: number;
  leftoverSavings: number;
  overspending: number;
  categoryTotals: Record<CategoryType, number>;
  pieData: BudgetPieSlice[];
  sankeyData: SankeyData;
  validExpenses: BudgetExpense[];
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function roundCurrency(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function normalizePositiveAmount(value: number): number {
  return value > 0 ? roundCurrency(value) : 0;
}

function getBudgetTimestamp(budget: Partial<SavedBudget>): number {
  const rawTimestamp = budget.updatedAt ?? budget.createdAt;
  if (!rawTimestamp) {
    return 0;
  }

  const parsed = Date.parse(rawTimestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Note 2: Saved budgets are surfaced to users as "recent work", so the list
 * and the initial page load both sort by the freshest write timestamp first.
 * Keeping the comparison in one helper avoids subtle drift between the list
 * order and whichever item the page auto-selects on first render.
 */
export function sortSavedBudgets<T extends Partial<SavedBudget>>(
  budgets: T[],
): T[] {
  return [...budgets].sort((left, right) => {
    const recencyDelta = getBudgetTimestamp(right) - getBudgetTimestamp(left);

    if (recencyDelta !== 0) {
      return recencyDelta;
    }

    return (left.name ?? "").localeCompare(right.name ?? "");
  });
}

/**
 * Derive all display-ready values from a budget draft in one pass.
 *
 * Note 3: `buildBudgetInsights` is intentionally the single call-site that
 * wires together normalization → pie → sankey. Components should call this
 * function and destructure what they need rather than calling the sub-builders
 * individually, so the color mapping between pie slices and Sankey expense
 * nodes stays consistent (colorByExpenseId is computed here and passed into
 * buildSankeyData).
 */
export function buildBudgetInsights(
  draft: Pick<BudgetDraft, "monthlyIncome" | "expenses">,
): BudgetInsights {
  const monthlyIncome = normalizePositiveAmount(Number(draft.monthlyIncome));
  const validExpenses = normalizeBudgetExpenses(draft.expenses, {
    fallbackNames: true,
  });
  const totalExpenses = roundCurrency(
    validExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  );
  const leftoverSavings = roundCurrency(
    Math.max(monthlyIncome - totalExpenses, 0),
  );
  const overspending = roundCurrency(
    Math.max(totalExpenses - monthlyIncome, 0),
  );

  const categoryTotals: Record<CategoryType, number> = {
    Need: 0,
    Want: 0,
    Saving: leftoverSavings,
  };

  for (const expense of validExpenses) {
    categoryTotals[expense.category] = roundCurrency(
      categoryTotals[expense.category] + expense.amount,
    );
  }

  const pieData = buildPieData(validExpenses, leftoverSavings);

  // Note 4: Build the expense-id→color map from the pie data so Sankey expense
  // nodes use the exact same shade as their corresponding pie wedge. Slices
  // with `autoGenerated: true` (e.g., "Leftover Savings") are excluded because
  // they map to a dedicated balance node in the Sankey graph, not an expense node.
  const colorByExpenseId = new Map(
    pieData
      .filter((slice) => !slice.autoGenerated)
      .map((slice) => [slice.key, slice.color]),
  );

  return {
    monthlyIncome,
    totalExpenses,
    leftoverSavings,
    overspending,
    categoryTotals,
    pieData,
    sankeyData: buildSankeyData(
      validExpenses,
      leftoverSavings,
      colorByExpenseId,
    ),
    validExpenses,
  };
}
