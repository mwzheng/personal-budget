import { SavedBudget } from "@/lib/types/types";
import { sortSavedBudgets } from "@/lib/utils/budget-planner";

/** Add or replace one saved budget while preserving the collection order. */
export function upsertSavedBudget(
  budgets: SavedBudget[],
  savedBudget: SavedBudget,
): SavedBudget[] {
  const budgetId = savedBudget.budgetId?.trim();
  if (!budgetId) {
    return budgets;
  }

  const nextBudgets = budgets.some(
    (budget) => budget.budgetId?.trim() === budgetId,
  )
    ? budgets.map((budget) =>
        budget.budgetId?.trim() === budgetId ? savedBudget : budget,
      )
    : [...budgets, savedBudget];

  return sortSavedBudgets(nextBudgets);
}
