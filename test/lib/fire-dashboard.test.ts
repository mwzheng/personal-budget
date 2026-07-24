import { describe, expect, it } from "vitest";
import type { FireProjectionRow } from "@/lib/types/types";
import {
  getFireMilestoneProgress,
  getFireProgress,
  getFireRemaining,
  getFireStatus,
  getFirstFireRow,
  getProjectedBalanceAtFire,
} from "@/lib/utils/fire-dashboard";

function row(overrides: Partial<FireProjectionRow> = {}): FireProjectionRow {
  return {
    year: 0,
    calendarYear: 2026,
    startBalance: 100,
    contributions: 0,
    growth: 10,
    endBalance: 110,
    endBalanceReal: 110,
    fireNumber: 200,
    fireNumberReal: 200,
    isFIREd: false,
    ...overrides,
  };
}

describe("fire dashboard helpers", () => {
  it("calculates normal and clamped progress", () => {
    expect(getFireProgress(250, 1_000)).toBe(0.25);
    expect(getFireProgress(-10, 1_000)).toBe(0);
    expect(getFireProgress(1_250, 1_000)).toBe(1);
  });

  it("treats a zero target as having no measurable progress", () => {
    expect(getFireProgress(0, 0)).toBe(0);
    expect(getFireProgress(100, 0)).toBe(0);
  });

  it("calculates remaining without returning a negative amount", () => {
    expect(getFireRemaining(250, 1_000)).toBe(750);
    expect(getFireRemaining(1_250, 1_000)).toBe(0);
  });

  it("finds the first FIRE row and its projected balance", () => {
    const rows = [
      row(),
      row({ year: 1, calendarYear: 2027, endBalance: 220, isFIREd: true }),
      row({ year: 2, isFIREd: true }),
    ];
    expect(getFirstFireRow(rows)?.calendarYear).toBe(2027);
    expect(getProjectedBalanceAtFire(rows)).toBe(220);
  });

  it("returns null for empty or unreachable rows", () => {
    expect(getFirstFireRow([])).toBeNull();
    expect(getProjectedBalanceAtFire([])).toBeNull();
    expect(getFireStatus(100, 200, [])).toBe("unreachable");
  });

  it("returns projected, reached, and no-target statuses", () => {
    expect(getFireStatus(100, 200, [row({ isFIREd: true })])).toBe("projected");
    expect(getFireStatus(200, 200, [])).toBe("reached");
    expect(getFireStatus(0, 0, [])).toBe("no-target");
  });

  it("derives target-relative milestone progress and handles above-target balances", () => {
    const milestones = getFireMilestoneProgress(600, 1_000);
    expect(milestones.map((milestone) => milestone.reached)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(milestones[2].progress).toBeCloseTo(0.8);
    expect(
      getFireMilestoneProgress(1_200, 1_000).every(
        (milestone) => milestone.reached,
      ),
    ).toBe(true);
  });

  it("handles zero-target milestones", () => {
    expect(
      getFireMilestoneProgress(0, 0).every(
        (milestone) =>
          milestone.amount === 0 &&
          !milestone.reached &&
          milestone.progress === 0,
      ),
    ).toBe(true);
  });
});
