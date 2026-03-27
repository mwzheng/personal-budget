import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { calculateFireNumber, generateProjection } from "@/lib/utils/fire";
import type { FireScenario } from "@/lib/types/types";

function buildScenario(overrides?: Partial<FireScenario>): FireScenario {
  return {
    name: "Test Scenario",
    currentBalance: 100_000,
    monthlyContribution: 2_000,
    annualReturnRate: 0.07,
    annualInflationRate: 0.03,
    annualExpenses: 40_000,
    withdrawalRate: 0.04,
    targetFireNumber: null,
    projectionYears: 30,
    ...overrides,
  };
}

describe("calculateFireNumber", () => {
  it("returns annual expenses divided by withdrawal rate", () => {
    expect(calculateFireNumber(40_000, 0.04)).toBe(1_000_000);
  });

  it("returns 0 when withdrawal rate is zero", () => {
    expect(calculateFireNumber(40_000, 0)).toBe(0);
  });

  it("returns 0 when withdrawal rate is negative", () => {
    expect(calculateFireNumber(40_000, -0.05)).toBe(0);
  });

  it("handles 3% withdrawal rate correctly", () => {
    expect(calculateFireNumber(30_000, 0.03)).toBeCloseTo(1_000_000, 0);
  });
});

describe("generateProjection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces the correct number of rows", () => {
    const scenario = buildScenario({ projectionYears: 20 });
    const { rows } = generateProjection(scenario);
    expect(rows).toHaveLength(20);
  });

  it("sets calendarYear starting from current year", () => {
    const scenario = buildScenario({ projectionYears: 5 });
    const { rows } = generateProjection(scenario);
    const thisYear = new Date().getFullYear();
    expect(rows[0].calendarYear).toBe(thisYear);
    expect(rows[4].calendarYear).toBe(thisYear + 4);
  });

  it("uses auto-calculated FIRE number when targetFireNumber is null", () => {
    const scenario = buildScenario({
      annualExpenses: 40_000,
      withdrawalRate: 0.04,
      targetFireNumber: null,
    });
    const { summary } = generateProjection(scenario);
    expect(summary.fireNumber).toBe(1_000_000);
  });

  it("uses custom targetFireNumber when provided", () => {
    const scenario = buildScenario({ targetFireNumber: 500_000 });
    const { summary } = generateProjection(scenario);
    expect(summary.fireNumber).toBe(500_000);
  });

  it("marks isFIREd when balance exceeds FIRE number", () => {
    const scenario = buildScenario({
      currentBalance: 900_000,
      monthlyContribution: 10_000,
      annualReturnRate: 0.07,
      projectionYears: 5,
    });
    const { rows } = generateProjection(scenario);
    const firedRow = rows.find((r) => r.isFIREd);
    expect(firedRow).toBeDefined();
  });

  it("returns null yearsToFire when target is unreachable", () => {
    const scenario = buildScenario({
      currentBalance: 0,
      monthlyContribution: 0,
      annualReturnRate: 0,
      annualExpenses: 40_000,
      withdrawalRate: 0.04,
      projectionYears: 5,
    });
    const { summary } = generateProjection(scenario);
    expect(summary.yearsToFire).toBeNull();
    expect(summary.fireDate).toBeNull();
  });

  it("returns correct fireDate when target is reachable", () => {
    const scenario = buildScenario({
      currentBalance: 900_000,
      monthlyContribution: 20_000,
      annualReturnRate: 0.07,
      projectionYears: 5,
    });
    const { summary } = generateProjection(scenario);
    expect(summary.yearsToFire).not.toBeNull();
    expect(summary.fireDate).not.toBeNull();
  });

  it("calculates inflation-adjusted values correctly", () => {
    const scenario = buildScenario({
      annualInflationRate: 0.03,
      projectionYears: 10,
    });
    const { rows } = generateProjection(scenario);
    // After 10 years, real value should be less than nominal
    const lastRow = rows[rows.length - 1];
    expect(lastRow.endBalanceReal).toBeLessThan(lastRow.endBalance);
    // fireNumber (nominal) should grow with inflation
    expect(rows[9].fireNumber).toBeGreaterThan(rows[0].fireNumber);
    // fireNumberReal should remain constant
    expect(rows[9].fireNumberReal).toBe(rows[0].fireNumberReal);
  });

  it("grows balance with compound returns even without contributions", () => {
    const scenario = buildScenario({
      currentBalance: 100_000,
      monthlyContribution: 0,
      annualReturnRate: 0.1,
      projectionYears: 10,
    });
    const { rows } = generateProjection(scenario);
    expect(rows[0].endBalance).toBeGreaterThan(100_000);
    expect(rows[9].endBalance).toBeGreaterThan(rows[0].endBalance);
  });

  it("accounts for monthly contributions correctly", () => {
    const scenario = buildScenario({
      currentBalance: 0,
      monthlyContribution: 1_000,
      annualReturnRate: 0,
      annualInflationRate: 0,
      projectionYears: 5,
    });
    const { rows, summary } = generateProjection(scenario);
    // With 0% return, balance = contributions only
    expect(rows[0].endBalance).toBe(12_000);
    expect(rows[4].endBalance).toBe(60_000);
    expect(summary.totalContributions).toBe(60_000);
  });

  it("first row startBalance equals currentBalance", () => {
    const scenario = buildScenario({ currentBalance: 50_000 });
    const { rows } = generateProjection(scenario);
    expect(rows[0].startBalance).toBe(50_000);
  });

  it("year-over-year startBalance equals previous endBalance", () => {
    const scenario = buildScenario({ projectionYears: 5 });
    const { rows } = generateProjection(scenario);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].startBalance).toBeCloseTo(rows[i - 1].endBalance, 2);
    }
  });

  it("growth + contributions equals balance change", () => {
    const scenario = buildScenario({ projectionYears: 5 });
    const { rows } = generateProjection(scenario);
    for (const row of rows) {
      const expected = row.startBalance + row.contributions + row.growth;
      expect(row.endBalance).toBeCloseTo(expected, 2);
    }
  });
});
