import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("Budget mutation refresh contract", () => {
  it("uses the saved mutation response and reserves reload for missing ids", () => {
    const page = readSource("app/budget/page.tsx");

    expect(page).toContain("setSavedBudget(persisted);");
    expect(page).toContain("if (persisted.budgetId?.trim())");
    expect(page).toContain("setBudgetsReloadKey((current) => current + 1);");
  });

  it("lets BudgetList consume a saved budget without issuing another collection fetch", () => {
    const list = readSource("components/budget/BudgetList.tsx");

    expect(list).toContain("savedBudget?: SavedBudget | null;");
    expect(list).toContain("handleBudgetSaved(savedBudget);");
    expect(list).toContain("upsertSavedBudget(current, budget)");
  });

  it("does not notify the parent from inside a budgets state updater", () => {
    const list = readSource("components/budget/BudgetList.tsx");

    expect(list).toContain("setBudgetSyncVersion((current) => current + 1);");
    expect(list).toContain("onBudgetsLoaded?.(budgets);");
    const stateUpdaters = list.match(
      /setBudgets\(\(current\) => \{[\s\S]*?\n\s*\}\);/g,
    );
    expect(stateUpdaters).not.toBeNull();
    expect(
      stateUpdaters?.every((updater) => !updater.includes("onBudgetsLoaded")),
    ).toBe(true);
  });

  it("keeps the allocation and comparison sections on the same active budget", () => {
    const page = readSource("app/budget/page.tsx");
    const comparison = readSource("components/budget/ActualVsBudget.tsx");

    expect(page).toContain("activeBudget={draft}");
    expect(page).toContain("activeBudgetId={editingBudgetId}");
    expect(page).toContain("onBudgetSelect={editBudget}");
    expect(comparison).toContain(
      "const selectedBudget = activeBudgetId ? activeBudget : null;",
    );
    expect(comparison).toContain("if (budget) onBudgetSelect(budget);");
  });
});
