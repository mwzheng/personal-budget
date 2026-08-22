import { describe, expect, it } from "vitest";

import type { Transaction } from "../../lib/types/types";
import { buildYearlyReport } from "../../lib/utils/aggregations";
import { formatTransactionLongDate } from "../../lib/utils/transaction-calendar";

function transaction(
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

describe("buildYearlyReport", () => {
  it("limits the current year to months through the reference month", () => {
    const report = buildYearlyReport(
      [
        transaction("jan", "2026-01-05", { amount: 40, tags: ["food"] }),
        transaction("future-day", "2026-03-20", { amount: 30 }),
        transaction("future", "2026-09-05", { amount: 70 }),
        transaction("prior", "2025-12-05", { amount: 90 }),
      ],
      2026,
      new Date(2026, 2, 15),
    );

    expect(report.months.map((month) => month.period)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(report.spendingAmount).toBe(40);
    expect(report.months[1]).toMatchObject({
      spendingAmount: 0,
      transactionCount: 0,
      hasData: false,
    });
  });

  it("includes all historical months, including zero-activity months", () => {
    const report = buildYearlyReport(
      [transaction("june", "2024-06-10", { amount: 80 })],
      2024,
      new Date(2026, 2, 15),
    );

    expect(report.months).toHaveLength(12);
    expect(report.months[0].period).toBe("2024-01");
    expect(report.months[11].period).toBe("2024-12");
    expect(report.months[5]).toMatchObject({
      period: "2024-06",
      spendingAmount: 80,
      hasData: true,
    });
  });

  it("separates income, spending, savings, and calculates a savings rate", () => {
    const report = buildYearlyReport(
      [
        transaction("income", "2025-01-01", {
          amount: 1_000,
          category: "Income",
        }),
        transaction("need", "2025-01-02", { amount: 300 }),
        transaction("want", "2025-02-02", { amount: 100, category: "Want" }),
        transaction("saving", "2025-02-03", {
          amount: 200,
          category: "Saving",
        }),
      ],
      2025,
      new Date(2026, 2, 15),
    );

    expect(report).toMatchObject({
      incomeAmount: 1_000,
      spendingAmount: 400,
      savingsAmount: 200,
      savingsRate: 20,
      transactionCount: 4,
      averageMonthlySpending: 400 / 12,
    });
  });

  it("uses stable empty fallbacks when income and selected-year activity are absent", () => {
    const report = buildYearlyReport([], 2024, new Date(2026, 2, 15));

    expect(report.incomeAmount).toBe(0);
    expect(report.savingsRate).toBeNull();
    expect(report.highestSpendMonth).toBeNull();
    expect(report.largestPurchase).toBeNull();
    expect(report.topTags).toEqual([]);
  });

  it("does not invent a highest-spend month when a year has no Need or Want spending", () => {
    const report = buildYearlyReport(
      [
        transaction("income", "2024-01-01", { category: "Income" }),
        transaction("saving", "2024-02-01", { category: "Saving" }),
      ],
      2024,
      new Date(2026, 2, 15),
    );

    expect(report.highestSpendMonth).toBeNull();
  });

  it("finds highlights and ranks tagged non-income amounts without changing spending totals", () => {
    const report = buildYearlyReport(
      [
        transaction("rent", "2025-01-02", {
          amount: 900,
          tags: ["home", "recurring"],
        }),
        transaction("trip", "2025-02-02", {
          amount: 1_200,
          category: "Want",
          tags: ["travel"],
        }),
        transaction("transfer", "2025-02-03", {
          amount: 1_300,
          category: "Saving",
          tags: ["emergency fund"],
        }),
        transaction("pay", "2025-02-03", {
          amount: 5_000,
          category: "Income",
          tags: ["payday"],
        }),
      ],
      2025,
      new Date(2026, 2, 15),
    );

    expect(report.spendingAmount).toBe(2_100);
    expect(report.highestSpendMonth?.period).toBe("2025-02");
    expect(report.largestPurchase?.id).toBe("trip");
    expect(report.largestPurchase?.date).toBe("2025-02-02");
    expect(formatTransactionLongDate(report.largestPurchase!.date)).toBe(
      "February 2, 2025",
    );
    expect(report.topTags).toEqual([
      { name: "emergency fund", value: 1_300 },
      { name: "travel", value: 1_200 },
      { name: "home", value: 900 },
      { name: "recurring", value: 900 },
    ]);
  });
});
