import { describe, expect, it } from "vitest";

import type { Transaction } from "../../lib/types/types";
import {
  buildYearComparison,
  buildYearSummary,
  getDefaultComparisonYears,
  getYearComparisonDateRange,
} from "../../lib/utils/aggregations";

function tx(
  id: string,
  date: string,
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id,
    name: id,
    amount: 100,
    category: "Need",
    date,
    notes: "",
    paymentMethod: "card",
    tags: [],
    ...overrides,
  };
}

describe("year comparison utilities", () => {
  it("uses full calendar years when both selected years are historical", () => {
    const comparison = buildYearComparison(
      [tx("old-december", "2024-12-31"), tx("new-december", "2025-12-31")],
      2024,
      2025,
      new Date(2026, 2, 15),
    );
    expect(comparison.scope).toBe("full-year");
    expect(comparison.previousYear.endDate).toBe("2024-12-31");
    expect(comparison.currentYear.spendingAmount).toBe(100);
  });

  it("compares current-year selections through the same day and clamps leap day", () => {
    expect(
      getYearComparisonDateRange(2025, "year-to-date", new Date(2024, 1, 29)),
    ).toMatchObject({ endDate: "2025-02-28", monthsIncluded: 2 });
    const comparison = buildYearComparison(
      [
        tx("included", "2023-02-28"),
        tx("excluded", "2023-03-01"),
        tx("current", "2024-02-29"),
      ],
      2023,
      2024,
      new Date(2024, 1, 29),
    );
    expect(comparison.scope).toBe("year-to-date");
    expect(comparison.previousYear.spendingAmount).toBe(100);
  });

  it("computes yearly metrics, point-based savings-rate deltas, and tagged spending", () => {
    const comparison = buildYearComparison(
      [
        tx("income-a", "2025-01-01", { amount: 1000, category: "Income" }),
        tx("need-a", "2025-01-02", { amount: 200, tags: ["home"] }),
        tx("save-a", "2025-01-03", {
          amount: 100,
          category: "Saving",
          tags: ["future"],
        }),
        tx("income-b", "2026-01-01", { amount: 2000, category: "Income" }),
        tx("want-b", "2026-01-02", {
          amount: 300,
          category: "Want",
          tags: ["fun"],
        }),
        tx("save-b", "2026-01-03", {
          amount: 400,
          category: "Saving",
          tags: ["future"],
        }),
      ],
      2025,
      2026,
      new Date(2026, 2, 15),
    );
    expect(comparison.previousYear).toMatchObject({
      incomeAmount: 1000,
      spendingAmount: 200,
      savingsAmount: 100,
      averageMonthlySpending: 200 / 3,
      transactionCount: 3,
      savingsRate: 10,
    });
    expect(comparison.currentYear).toMatchObject({
      incomeAmount: 2000,
      spendingAmount: 300,
      savingsAmount: 400,
      savingsRate: 20,
    });
    expect(comparison.changes.savingsRate).toBe(10);
    expect(comparison.currentYear.topTags).toEqual([
      { name: "future", value: 400 },
      { name: "fun", value: 300 },
    ]);
  });

  it("has stable defaults and safe same-year, empty, and zero-income cases", () => {
    expect(getDefaultComparisonYears([], new Date(2026, 4, 1))).toEqual([
      2025, 2026,
    ]);
    expect(getDefaultComparisonYears([tx("only", "2024-01-01")])).toEqual([
      2024, 2024,
    ]);
    const empty = buildYearComparison([], 2025, 2025, new Date(2026, 2, 15));
    expect(empty.previousYear).toEqual(empty.currentYear);
    expect(empty.changes.spendingAmount).toBe(0);
    expect(empty.changes.savingsRate).toBeNull();
    expect(
      buildYearSummary(
        [tx("saving", "2025-01-01", { category: "Saving" })],
        2025,
        "full-year",
      ).savingsRate,
    ).toBeNull();
  });
});
