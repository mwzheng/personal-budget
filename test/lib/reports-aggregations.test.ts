// Note 1: These tests lock down the reports-page startup rules so refactors in
// the UI layer cannot silently change which year is selected by default.
import { describe, expect, it } from "vitest";

import {
  getReportDateRangePreset,
  aggregateTransactions,
  createYearDateRange,
  filterTransactions,
  getAvailableReportYears,
  resolveDefaultReportYear,
  resolveDefaultReportYears,
} from "../../lib/utils/aggregations";
import type { Transaction } from "../../lib/types/types";
import { initializeReportFilters } from "../../lib/utils/reportUtils";

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
      categories: [],
      tags: [],
      search: "",
    });

    expect(filtered.map((transaction) => transaction.id)).toEqual([
      "1",
      "2",
      "4",
    ]);
  });

  it("normalizes legacy category labels, tracks income separately, and excludes savings from spendingAmount", () => {
    const aggregates = aggregateTransactions([
      buildTransaction("want", "2025-01-01", {
        amount: 30,
        category: "Wants" as Transaction["category"],
      }),
      buildTransaction("saving", "2025-01-02", {
        amount: 20,
        category: "Savings" as Transaction["category"],
      }),
      buildTransaction("income", "2025-01-03", {
        amount: 100,
        category: "Income",
      }),
    ]);

    expect(aggregates.totalByCategoryType.Want).toBe(30);
    expect(aggregates.totalByCategoryType.Saving).toBe(20);
    expect(aggregates.spendingAmount).toBe(30);
    expect(aggregates.incomeAmount).toBe(100);
    expect(aggregates.totalAmount).toBe(150);
  });

  it("filters transactions by selected categories", () => {
    const filtered = filterTransactions(
      [
        buildTransaction("need", "2025-01-01", { category: "Need" }),
        buildTransaction("want", "2025-01-02", { category: "Want" }),
        buildTransaction("saving", "2025-01-03", { category: "Saving" }),
        buildTransaction("income", "2025-01-04", { category: "Income" }),
      ],
      {
        years: [],
        startDate: null,
        endDate: null,
        categories: ["Need", "Saving", "Income"],
        tags: [],
        search: "",
      },
    );

    expect(filtered.map((transaction) => transaction.id)).toEqual([
      "need",
      "saving",
      "income",
    ]);
  });

  it("builds monthly spending and income series separately", () => {
    const aggregates = aggregateTransactions([
      buildTransaction("need", "2025-01-01", {
        amount: 60,
        category: "Need",
      }),
      buildTransaction("saving", "2025-01-02", {
        amount: 15,
        category: "Saving",
      }),
      buildTransaction("income", "2025-01-03", {
        amount: 300,
        category: "Income",
      }),
      buildTransaction("want", "2025-02-01", {
        amount: 25,
        category: "Want",
      }),
    ]);

    expect(aggregates.timeseries).toEqual([
      {
        period: "2025-01",
        spendingAmount: 60,
        incomeAmount: 300,
        Need: 60,
        Want: 0,
        Saving: 15,
      },
      {
        period: "2025-02",
        spendingAmount: 25,
        incomeAmount: 0,
        Need: 0,
        Want: 25,
        Saving: 0,
      },
    ]);
  });

  // Note 2: Aggregating an empty transaction list must produce zeroed totals
  // rather than undefined fields — protects report views on new accounts.
  it("returns zeroed aggregates when the transaction list is empty", () => {
    const aggregates = aggregateTransactions([]);

    expect(aggregates.totalAmount).toBe(0);
    expect(aggregates.spendingAmount).toBe(0);
    expect(aggregates.incomeAmount).toBe(0);
  });

  it("filters out all transactions when no year matches the selected years", () => {
    const filtered = filterTransactions(transactions, {
      years: ["2099"],
      startDate: null,
      endDate: null,
      categories: [],
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
      categories: [],
      tags: [],
      search: "",
    });

    expect(filtered).toHaveLength(transactions.length);
  });
});

describe("report filter initialization", () => {
  const transactions = [
    buildTransaction("2024", "2024-01-15", { tags: ["groceries", "home"] }),
    buildTransaction("2023", "2023-08-10", { tags: ["travel"] }),
  ];

  it("prefers a complete stored preference and reconciles stale years and tags", () => {
    expect(
      initializeReportFilters(
        transactions,
        {
          years: ["2024", "2022"],
          startDate: null,
          endDate: null,
          categories: ["Need"],
          tags: ["groceries", "stale"],
          search: "coffee",
        },
        ["2023"],
      ),
    ).toEqual({
      years: ["2024"],
      startDate: null,
      endDate: null,
      categories: ["Need"],
      tags: ["groceries"],
      search: "coffee",
    });
  });

  it("preserves stored dates, categories, and search while reconciling tags", () => {
    expect(
      initializeReportFilters(
        transactions,
        {
          years: [],
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          categories: ["Income"],
          tags: ["missing"],
          search: "paycheck",
        },
        ["2023"],
      ),
    ).toEqual({
      years: [],
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      categories: ["Income"],
      tags: [],
      search: "paycheck",
    });
  });

  it("uses legacy saved years then the default year only when no complete preference exists", () => {
    expect(
      initializeReportFilters(transactions, null, ["2023", "2022"]),
    ).toEqual({
      years: ["2023"],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
    });
  });

  it("does not fall back to legacy years for a valid empty stored preference", () => {
    expect(
      initializeReportFilters(
        transactions,
        {
          years: [],
          startDate: null,
          endDate: null,
          categories: [],
          tags: [],
          search: "",
        },
        ["2023"],
      ),
    ).toEqual({
      years: [],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
    });
  });

  it("falls back to the newest available year when stored years are stale", () => {
    expect(
      initializeReportFilters(
        transactions,
        {
          years: ["2022"],
          startDate: null,
          endDate: null,
          categories: [],
          tags: [],
          search: "",
        },
        ["2023"],
      ),
    ).toEqual({
      years: ["2024"],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
    });
  });
});

describe("report date-range presets", () => {
  const referenceDate = new Date(2024, 2, 15, 12);

  it.each([
    ["this-month", { startDate: "2024-03-01", endDate: "2024-03-31" }],
    ["last-month", { startDate: "2024-02-01", endDate: "2024-02-29" }],
    ["this-quarter", { startDate: "2024-01-01", endDate: "2024-03-31" }],
    ["last-quarter", { startDate: "2023-10-01", endDate: "2023-12-31" }],
    ["this-year", { startDate: "2024-01-01", endDate: "2024-12-31" }],
    ["last-year", { startDate: "2023-01-01", endDate: "2023-12-31" }],
    ["last-90-days", { startDate: "2023-12-17", endDate: "2024-03-15" }],
    ["all-time", { startDate: null, endDate: null }],
    ["custom", { startDate: null, endDate: null }],
  ] as const)("returns the %s local-calendar range", (preset, expected) => {
    expect(getReportDateRangePreset(preset, referenceDate)).toEqual(expected);
  });
});
