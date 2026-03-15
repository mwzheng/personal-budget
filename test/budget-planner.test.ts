// Note 1: These tests lock down the planner math so UI refactors cannot
// accidentally change how leftover savings, overspending, or grouped Sankey
// branches are derived from the same set of expense rows.
import { describe, expect, it } from "vitest";

import {
  buildBudgetInsights,
  normalizeBudgetForEditor,
} from "../lib/budget-planner";

describe("buildBudgetInsights", () => {
  it("adds leftover savings when planned expenses are below income", () => {
    const result = buildBudgetInsights({
      monthlyIncome: 4000,
      expenses: [
        {
          expenseId: "rent",
          name: "Rent",
          amount: 1400,
          category: "Need",
          group: "Housing",
        },
        {
          expenseId: "gym",
          name: "Gym",
          amount: 50,
          category: "Want",
          group: "",
        },
      ],
    });

    expect(result.leftoverSavings).toBe(2550);
    expect(result.overspending).toBe(0);
    expect(result.categoryTotals.Saving).toBe(2550);
    expect(result.pieData.map((slice) => slice.name)).toContain(
      "Leftover savings",
    );
  });

  it("reports overspending without inventing leftover savings", () => {
    const result = buildBudgetInsights({
      monthlyIncome: 1000,
      expenses: [
        {
          expenseId: "rent",
          name: "Rent",
          amount: 900,
          category: "Need",
          group: "Housing",
        },
        {
          expenseId: "groceries",
          name: "Groceries",
          amount: 250,
          category: "Need",
          group: "Food",
        },
      ],
    });

    expect(result.leftoverSavings).toBe(0);
    expect(result.overspending).toBe(150);
    expect(result.pieData.map((slice) => slice.name)).not.toContain(
      "Leftover savings",
    );
  });

  it("creates grouped Sankey branches when expenses share a group label", () => {
    const result = buildBudgetInsights({
      monthlyIncome: 3000,
      expenses: [
        {
          expenseId: "car-note",
          name: "Car note",
          amount: 420,
          category: "Need",
          group: "Car",
        },
        {
          expenseId: "gas",
          name: "Gas",
          amount: 120,
          category: "Need",
          group: "Car",
        },
        {
          expenseId: "rent",
          name: "Rent",
          amount: 1200,
          category: "Need",
          group: "Housing",
        },
      ],
    });

    const sankeyLabels = result.sankeyData.nodes.map(
      (node) => node.label ?? node.id,
    );
    expect(sankeyLabels).toContain("Car");
    expect(sankeyLabels).toContain("Car note");
    expect(sankeyLabels).toContain("Gas");
    expect(result.sankeyData.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "category:Need",
          target: "group:Need:car",
          value: 540,
        }),
      ]),
    );
  });
});

describe("normalizeBudgetForEditor", () => {
  it("converts legacy allocations into expense rows and infers income", () => {
    const result = normalizeBudgetForEditor({
      budgetId: "legacy-1",
      name: "Legacy",
      allocations: [
        { category: "Savings", amount: 300 },
        { category: "Groceries", amount: 200 },
      ],
    });

    expect(result.monthlyIncome).toBe(500);
    expect(result.expenses).toHaveLength(2);
    expect(result.expenses[0].category).toBe("Saving");
    expect(result.expenses[1].category).toBe("Need");
  });
});
