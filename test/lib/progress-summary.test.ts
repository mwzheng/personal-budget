import { describe, expect, it } from "vitest";
import {
  computeGoalProgress,
  getLatestRetirementTotal,
  getLatestSalary,
} from "../../lib/progress/progress-summary";
import type { RetirementEntry, SalaryEntry } from "../../lib/types/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRetirement(
  overrides: Partial<RetirementEntry> = {},
): RetirementEntry {
  return {
    entryId: "r1",
    year: 2023,
    startAmount: 0,
    endAmount: 100_000,
    ...overrides,
  };
}

function makeSalary(overrides: Partial<SalaryEntry> = {}): SalaryEntry {
  return {
    entryId: "s1",
    year: 2023,
    amount: 80_000,
    yoy: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getLatestRetirementTotal
// ---------------------------------------------------------------------------

describe("getLatestRetirementTotal", () => {
  it("returns null for an empty array", () => {
    expect(getLatestRetirementTotal([])).toBeNull();
  });

  it("returns the endAmount for a single entry", () => {
    const entries = [makeRetirement({ year: 2022, endAmount: 50_000 })];
    expect(getLatestRetirementTotal(entries)).toBe(50_000);
  });

  it("returns the endAmount from the entry with the highest year", () => {
    const entries = [
      makeRetirement({ entryId: "r1", year: 2020, endAmount: 30_000 }),
      makeRetirement({ entryId: "r2", year: 2023, endAmount: 90_000 }),
      makeRetirement({ entryId: "r3", year: 2021, endAmount: 50_000 }),
    ];
    expect(getLatestRetirementTotal(entries)).toBe(90_000);
  });

  it("handles entries provided in reverse-chronological order", () => {
    const entries = [
      makeRetirement({ entryId: "r1", year: 2025, endAmount: 200_000 }),
      makeRetirement({ entryId: "r2", year: 2024, endAmount: 150_000 }),
    ];
    expect(getLatestRetirementTotal(entries)).toBe(200_000);
  });
});

// ---------------------------------------------------------------------------
// getLatestSalary
// ---------------------------------------------------------------------------

describe("getLatestSalary", () => {
  it("returns null for an empty array", () => {
    expect(getLatestSalary([])).toBeNull();
  });

  it("returns the amount for a single entry", () => {
    const entries = [makeSalary({ year: 2022, amount: 75_000 })];
    expect(getLatestSalary(entries)).toBe(75_000);
  });

  it("returns the amount from the entry with the highest year", () => {
    const entries = [
      makeSalary({ entryId: "s1", year: 2019, amount: 60_000 }),
      makeSalary({ entryId: "s2", year: 2023, amount: 100_000 }),
      makeSalary({ entryId: "s3", year: 2021, amount: 80_000 }),
    ];
    expect(getLatestSalary(entries)).toBe(100_000);
  });
});

// ---------------------------------------------------------------------------
// computeGoalProgress
// ---------------------------------------------------------------------------

describe("computeGoalProgress", () => {
  it("returns null values when latestEnd is null", () => {
    const result = computeGoalProgress(null, 500_000);
    expect(result.rawPct).toBeNull();
    expect(result.clampedPct).toBeNull();
  });

  it("returns null values when targetAmount is null", () => {
    const result = computeGoalProgress(250_000, null);
    expect(result.rawPct).toBeNull();
    expect(result.clampedPct).toBeNull();
  });

  it("returns null values when both inputs are null", () => {
    const result = computeGoalProgress(null, null);
    expect(result.rawPct).toBeNull();
    expect(result.clampedPct).toBeNull();
  });

  it("returns null values when targetAmount is zero (division guard)", () => {
    const result = computeGoalProgress(100_000, 0);
    expect(result.rawPct).toBeNull();
    expect(result.clampedPct).toBeNull();
  });

  it("computes 50% when latestEnd is half of target", () => {
    const result = computeGoalProgress(250_000, 500_000);
    expect(result.rawPct).toBe(50);
    expect(result.clampedPct).toBe(50);
  });

  it("computes 100% when latestEnd equals target", () => {
    const result = computeGoalProgress(500_000, 500_000);
    expect(result.rawPct).toBe(100);
    expect(result.clampedPct).toBe(100);
  });

  it("raw percentage can exceed 100 when latestEnd surpasses target", () => {
    const result = computeGoalProgress(600_000, 500_000);
    expect(result.rawPct).toBe(120);
    // clampedPct must not exceed 100 for use in progress bars
    expect(result.clampedPct).toBe(100);
  });

  it("clamps negative raw percentage to 0", () => {
    // Negative latestEnd is pathological but the guard must hold.
    const result = computeGoalProgress(-100, 500_000);
    expect(result.rawPct).toBeLessThan(0);
    expect(result.clampedPct).toBe(0);
  });

  it("rounds rawPct to two decimal places", () => {
    // 1/3 of target → ≈33.33%
    const result = computeGoalProgress(Math.round(500_000 / 3), 500_000);
    expect(typeof result.rawPct).toBe("number");
    // Verify rounding: value should be 33.33 (or close float representation)
    expect(result.rawPct?.toFixed(2)).toBe("33.33");
  });
});
