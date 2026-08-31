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
});
