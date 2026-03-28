// Note 1: These tests lock down the reports-page startup rules so refactors in
// the UI layer cannot silently change which year is selected by default.
import { describe, expect, it } from "vitest";

import {
  aggregateTransactions,
  createYearDateRange,
  filterTransactions,
  getAvailableReportYears,
  resolveDefaultReportYear,
  resolveDefaultReportYears,
} from "../lib/utils/aggregations";
import type { Transaction } from "../lib/types/types";

function buildTransaction(
  id: string,
  date: string,
  overrides?: Partial<Transaction>,
): Transaction {
  return {
    id,
    name: `transaction-${id}`,
    amount: 25,
    category: "Need",
    date,
    notes: "",
    paymentMethod: "card",
    tags: [],
    ...overrides,
  };
}

describe("reports year helpers", () => {
  const transactions = [
    buildTransaction("1", "2022-02-10"),
    buildTransaction("2", "2024-05-15"),
    buildTransaction("3", "2023-09-21"),
    buildTransaction("4", "2024-01-03"),
  ];

  it("returns unique report years in descending order", () => {
    expect(getAvailableReportYears(transactions)).toEqual([
      "2024",
      "2023",
      "2022",
    ]);
  });

  it("restores the stored year when it is still present in the data", () => {
    expect(resolveDefaultReportYear(transactions, "2023")).toBe("2023");
  });

  it("restores multiple stored years when they still exist in the data", () => {
    expect(resolveDefaultReportYears(transactions, ["2023", "2022"])).toEqual([
      "2023",
      "2022",
    ]);
  });

  it("falls back to the latest transaction year when the stored year is missing", () => {
    expect(resolveDefaultReportYear(transactions, null)).toBe("2024");
  });

  it("ignores stale stored years that are no longer available", () => {
    expect(resolveDefaultReportYear(transactions, "2025")).toBe("2024");
  });

  it("uses the fallback calendar year when there is no transaction history", () => {
    expect(
      resolveDefaultReportYear([], null, new Date("2026-03-12T00:00:00Z")),
    ).toBe("2026");
  });

  it("creates the expected ISO date range for a selected year", () => {
    expect(createYearDateRange("2024")).toEqual({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
  });

  it("filters transactions by multiple selected years", () => {
    const filtered = filterTransactions(transactions, {
      years: ["2024", "2022"],
      startDate: null,
      endDate: null,
      tags: [],
      search: "",
    });

    expect(filtered.map((transaction) => transaction.id)).toEqual([
      "1",
      "2",
      "4",
    ]);
  });

  it("normalizes legacy category labels and excludes savings from spendingAmount", () => {
    const aggregates = aggregateTransactions([
      buildTransaction("want", "2025-01-01", {
        amount: 30,
        category: "Wants" as Transaction["category"],
      }),
      buildTransaction("saving", "2025-01-02", {
        amount: 20,
        category: "Savings" as Transaction["category"],
      }),
    ]);

    expect(aggregates.totalByCategoryType.Want).toBe(30);
    expect(aggregates.totalByCategoryType.Saving).toBe(20);
    expect(aggregates.spendingAmount).toBe(30);
    expect(aggregates.totalAmount).toBe(50);
  });

  // Note 2: Aggregating an empty transaction list must produce zeroed totals
  // rather than undefined fields — protects report views on new accounts.
  it("returns zeroed aggregates when the transaction list is empty", () => {
    const aggregates = aggregateTransactions([]);

    expect(aggregates.totalAmount).toBe(0);
    expect(aggregates.spendingAmount).toBe(0);
  });

  it("filters out all transactions when no year matches the selected years", () => {
    const filtered = filterTransactions(transactions, {
      years: ["2099"],
      startDate: null,
      endDate: null,
      tags: [],
      search: "",
    });

    expect(filtered).toEqual([]);
  });

  it("returns all transactions when no filter criteria are specified", () => {
    const filtered = filterTransactions(transactions, {
      years: [],
      startDate: null,
      endDate: null,
      tags: [],
      search: "",
    });

    expect(filtered).toHaveLength(transactions.length);
  });
});
