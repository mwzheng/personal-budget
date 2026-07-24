import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildProjectionBreakdownRows,
  calculateFireNumber,
  formatFireDateLabel,
  generateProjection,
} from "@/lib/utils/fire";
import type { FireScenario, RetirementEntry } from "@/lib/types/types";

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

function buildRetirementEntry(
  year: number,
  overrides?: Partial<RetirementEntry>,
): RetirementEntry {
  return {
    entryId: `ret-${year}`,
    year,
    startAmount: 100_000,
    endAmount: 120_000,
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
    // generateProjection uses getUTCFullYear(); match that here
    const thisYear = new Date().getUTCFullYear();
    expect(rows[0].calendarYear).toBe(thisYear);
    expect(rows[4].calendarYear).toBe(thisYear + 4);
  });

  it("supports overriding the projection start year", () => {
    const scenario = buildScenario({ projectionYears: 3 });
    const { rows } = generateProjection(scenario, { startYear: 2023 });

    expect(rows.map((row) => row.calendarYear)).toEqual([2023, 2024, 2025]);
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

  it("does not mark a projection as FIREd when no target exists", () => {
    const scenario = buildScenario({
      annualExpenses: 40_000,
      withdrawalRate: 0,
      targetFireNumber: null,
      projectionYears: 3,
    });
    const { rows, summary } = generateProjection(scenario);
    expect(summary.fireNumber).toBe(0);
    expect(summary.yearsToFire).toBeNull();
    expect(rows.every((row) => !row.isFIREd)).toBe(true);
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

  it("generates fireDate at midnight UTC to avoid hydration drift", () => {
    const scenario = buildScenario({
      currentBalance: 900_000,
      monthlyContribution: 20_000,
      annualReturnRate: 0.07,
      projectionYears: 5,
    });
    const { summary } = generateProjection(scenario);
    expect(summary.fireDate).toMatch(/T00:00:00\.000Z$/);
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

describe("buildProjectionBreakdownRows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("combines past estimated rows with future projected rows", () => {
    const historicalRows = generateProjection(
      buildScenario({
        currentBalance: 25_000,
        projectionYears: 3,
      }),
      { startYear: 2023 },
    ).rows;
    const futureRows = generateProjection(
      buildScenario({
        currentBalance: 53_600,
        projectionYears: 3,
      }),
    );

    const rows = buildProjectionBreakdownRows({
      historicalEstimatedRows: historicalRows,
      futureProjectedRows: futureRows.rows,
      retirementEntries: [
        buildRetirementEntry(2023, { startAmount: 25_000, endAmount: 31_250 }),
        buildRetirementEntry(2024, { startAmount: 31_250, endAmount: 40_800 }),
        buildRetirementEntry(2025, { startAmount: 40_800, endAmount: 53_600 }),
      ],
    });

    expect(rows.map((row) => row.calendarYear)).toEqual([
      2023, 2024, 2025, 2026, 2027, 2028,
    ]);
    expect(rows[0].rowType).toBe("historical-estimate");
    expect(rows[0].actualEndBalance).toBe(31_250);
    expect(rows[0].contributions).toBeNull();
    expect(rows[0].growth).toBeNull();
    expect(rows[3].rowType).toBe("projection");
    expect(rows[3].actualEndBalance).toBeNull();
  });

  it("attaches recorded balances to overlapping projected years", () => {
    const futureRows = generateProjection(
      buildScenario({ projectionYears: 2 }),
    );

    const rows = buildProjectionBreakdownRows({
      futureProjectedRows: futureRows.rows,
      retirementEntries: [
        buildRetirementEntry(2026),
        buildRetirementEntry(2027),
      ],
    });

    expect(rows.map((row) => row.actualEndBalance)).toEqual([120_000, 120_000]);
    expect(rows.every((row) => row.rowType === "projection")).toBe(true);
  });
});

describe("formatFireDateLabel", () => {
  it("returns an em dash when no fire date exists", () => {
    expect(formatFireDateLabel(null)).toBe("—");
  });

  it("formats ISO dates in UTC so SSR and hydration stay aligned", () => {
    expect(formatFireDateLabel("2026-01-01T00:00:00.000Z")).toBe("Jan 2026");
  });
});
