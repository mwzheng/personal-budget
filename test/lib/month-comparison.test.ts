import { describe, expect, it } from "vitest";

import {
  buildMonthComparison,
  buildMonthSummary,
  getAvailableMonths,
  getDefaultComparisonMonths,
  getMonthTransactions,
} from "../../lib/utils/aggregations";
import type { Transaction } from "../../lib/types/types";

function tx(
  id: string,
  date: string,
  overrides?: Partial<Transaction>,
): Transaction {
  return {
    id,
    name: `txn-${id}`,
    amount: 100,
    category: "Need",
    date,
    notes: "",
    paymentMethod: "card",
    tags: [],
    ...overrides,
  };
}

describe("getAvailableMonths", () => {
  it("returns unique months sorted chronologically", () => {
    const txns = [
      tx("1", "2025-03-01"),
      tx("2", "2025-01-15"),
      tx("3", "2025-03-20"),
      tx("4", "2024-12-05"),
    ];

    expect(getAvailableMonths(txns)).toEqual(["2024-12", "2025-01", "2025-03"]);
  });

  it("returns empty array for no transactions", () => {
    expect(getAvailableMonths([])).toEqual([]);
  });
});

describe("getMonthTransactions", () => {
  const txns = [
    tx("a", "2025-03-01"),
    tx("b", "2025-03-15"),
    tx("c", "2025-04-01"),
  ];

  it("filters transactions to the given month", () => {
    const result = getMonthTransactions(txns, "2025-03");
    expect(result.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("returns empty array when no transactions match", () => {
    expect(getMonthTransactions(txns, "2025-06")).toEqual([]);
  });
});

describe("buildMonthSummary", () => {
  it("computes correct totals and category breakdown", () => {
    const txns = [
      tx("1", "2025-03-01", { amount: 200, category: "Need" }),
      tx("2", "2025-03-10", { amount: 50, category: "Want" }),
      tx("3", "2025-03-15", { amount: 300, category: "Saving" }),
      tx("4", "2025-04-01", { amount: 999, category: "Need" }),
    ];

    const summary = buildMonthSummary(txns, "2025-03");

    expect(summary.period).toBe("2025-03");
    expect(summary.totalAmount).toBe(550);
    expect(summary.spendingAmount).toBe(250);
    expect(summary.incomeAmount).toBe(0);
    expect(summary.totalByCategoryType).toEqual({
      Need: 200,
      Want: 50,
      Saving: 300,
    });
    expect(summary.transactionCount).toBe(3);
  });

  it("includes top tags sorted by spend", () => {
    const txns = [
      tx("1", "2025-03-01", { amount: 100, tags: ["groceries", "food"] }),
      tx("2", "2025-03-02", { amount: 200, tags: ["rent"] }),
      tx("3", "2025-03-03", { amount: 50, tags: ["food"] }),
      tx("4", "2025-03-04", {
        amount: 1200,
        category: "Income",
        tags: ["payroll"],
      }),
    ];

    const summary = buildMonthSummary(txns, "2025-03");

    expect(summary.topTags[0]).toEqual({ name: "rent", value: 200 });
    expect(summary.topTags[1]).toEqual({ name: "food", value: 150 });
  });

  it("tracks monthly income separately from spending", () => {
    const summary = buildMonthSummary(
      [
        tx("income", "2025-03-01", { amount: 2200, category: "Income" }),
        tx("need", "2025-03-02", { amount: 150, category: "Need" }),
      ],
      "2025-03",
    );

    expect(summary.totalAmount).toBe(2350);
    expect(summary.spendingAmount).toBe(150);
    expect(summary.incomeAmount).toBe(2200);
  });

  it("returns zeroed summary for a month with no data", () => {
    const summary = buildMonthSummary([], "2025-06");

    expect(summary.totalAmount).toBe(0);
    expect(summary.spendingAmount).toBe(0);
    expect(summary.incomeAmount).toBe(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.topTags).toEqual([]);
  });
});

describe("buildMonthComparison", () => {
  it("computes percentage changes between two months", () => {
    const txns = [
      tx("1", "2025-01-01", { amount: 100, category: "Need" }),
      tx("2", "2025-01-02", { amount: 50, category: "Want" }),
      tx("income-a", "2025-01-03", { amount: 500, category: "Income" }),
      tx("3", "2025-02-01", { amount: 200, category: "Need" }),
      tx("4", "2025-02-02", { amount: 50, category: "Want" }),
      tx("income-b", "2025-02-03", { amount: 750, category: "Income" }),
    ];

    const comparison = buildMonthComparison(txns, "2025-01", "2025-02");

    expect(comparison.prevMonth.period).toBe("2025-01");
    expect(comparison.currMonth.period).toBe("2025-02");
    // Need: 100 → 200 = +100%
    expect(comparison.changes.Need).toBeCloseTo(100);
    // Want: 50 → 50 = 0%
    expect(comparison.changes.Want).toBeCloseTo(0);
    // Income: 500 → 750 = +50%
    expect(comparison.changes.incomeAmount).toBeCloseTo(50);
    // Total: 650 → 1000 = +53.85%
    expect(comparison.changes.totalAmount).toBeCloseTo(53.85, 1);
  });

  it("returns null for changes when base month has zero in a category", () => {
    const txns = [tx("1", "2025-02-01", { amount: 100, category: "Saving" })];

    const comparison = buildMonthComparison(txns, "2025-01", "2025-02");

    // Month A has nothing → base is 0 → null for non-zero month B
    expect(comparison.changes.Saving).toBeNull();
    // Both zero → 0
    expect(comparison.changes.Need).toBe(0);
  });

  it("handles both months being empty", () => {
    const comparison = buildMonthComparison([], "2025-01", "2025-02");

    expect(comparison.changes.totalAmount).toBe(0);
    expect(comparison.changes.spendingAmount).toBe(0);
    expect(comparison.changes.incomeAmount).toBe(0);
    expect(comparison.prevMonth.transactionCount).toBe(0);
    expect(comparison.currMonth.transactionCount).toBe(0);
  });

  it("handles negative percentage change correctly", () => {
    const txns = [
      tx("1", "2025-01-01", { amount: 200, category: "Need" }),
      tx("2", "2025-02-01", { amount: 100, category: "Need" }),
    ];

    const comparison = buildMonthComparison(txns, "2025-01", "2025-02");
    // 200 → 100 = -50%
    expect(comparison.changes.Need).toBeCloseTo(-50);
  });
});

describe("getDefaultComparisonMonths", () => {
  it("returns the current and previous month when both have data", () => {
    const today = new Date("2025-03-15");
    const txns = [tx("1", "2025-02-01"), tx("2", "2025-03-01")];

    const [prev, curr] = getDefaultComparisonMonths(txns, today);
    expect(prev).toBe("2025-02");
    expect(curr).toBe("2025-03");
  });

  it("falls back to the two most recent months when current month has no data", () => {
    const today = new Date("2025-06-15");
    const txns = [
      tx("1", "2025-01-01"),
      tx("2", "2025-03-01"),
      tx("3", "2025-04-01"),
    ];

    const [a, b] = getDefaultComparisonMonths(txns, today);
    expect(a).toBe("2025-03");
    expect(b).toBe("2025-04");
  });

  it("returns the same month twice when only one month has data", () => {
    const txns = [tx("1", "2025-05-01")];

    const [a, b] = getDefaultComparisonMonths(txns, new Date("2025-05-15"));
    expect(a).toBe("2025-05");
    expect(b).toBe("2025-05");
  });

  it("returns calendar-based defaults when there are no transactions", () => {
    const today = new Date("2025-03-15");
    const [prev, curr] = getDefaultComparisonMonths([], today);
    expect(prev).toBe("2025-02");
    expect(curr).toBe("2025-03");
  });

  it("handles January correctly (previous month crosses year boundary)", () => {
    const today = new Date("2025-01-10");
    const [prev, curr] = getDefaultComparisonMonths([], today);
    expect(prev).toBe("2024-12");
    expect(curr).toBe("2025-01");
  });
});
