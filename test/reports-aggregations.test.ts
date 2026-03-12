// Note 1: These tests lock down the reports-page startup rules so refactors in
// the UI layer cannot silently change which year is selected by default.
import { describe, expect, it } from "vitest";

import {
  createYearDateRange,
  getAvailableReportYears,
  resolveDefaultReportYear,
} from "../lib/aggregations";
import type { Transaction } from "../lib/types";

function buildTransaction(id: string, date: string): Transaction {
  return {
    id,
    name: `transaction-${id}`,
    amount: 25,
    category: "Need",
    date,
    notes: "",
    paymentMethod: "card",
    tags: [],
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
});
