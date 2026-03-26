import { describe, it, expect } from "vitest";
import { SK_PREFIX } from "@/lib/api/tableKeys";

describe("SK_PREFIX constants", () => {
  it("TRANSACTION is 'date#'", () => {
    expect(SK_PREFIX.TRANSACTION).toBe("date#");
  });

  it("GOAL is 'goal#'", () => {
    expect(SK_PREFIX.GOAL).toBe("goal#");
  });

  it("BUDGET is 'budget#'", () => {
    expect(SK_PREFIX.BUDGET).toBe("budget#");
  });

  it("SALARY is 'salary#'", () => {
    expect(SK_PREFIX.SALARY).toBe("salary#");
  });

  it("RETIREMENT is 'retirement#'", () => {
    expect(SK_PREFIX.RETIREMENT).toBe("retirement#");
  });

  it("MILESTONE is 'milestone#'", () => {
    expect(SK_PREFIX.MILESTONE).toBe("milestone#");
  });

  it("PROGRESS_GOAL is 'progressGoal#'", () => {
    expect(SK_PREFIX.PROGRESS_GOAL).toBe("progressGoal#");
  });

  it("every prefix is a non-empty string ending with '#'", () => {
    for (const [key, value] of Object.entries(SK_PREFIX)) {
      expect(typeof value, `SK_PREFIX.${key} should be a string`).toBe(
        "string",
      );
      expect(
        value.length,
        `SK_PREFIX.${key} should not be empty`,
      ).toBeGreaterThan(0);
      expect(value, `SK_PREFIX.${key} should end with '#'`).toMatch(/#$/);
    }
  });

  it("exports exactly the expected set of keys", () => {
    const keys = Object.keys(SK_PREFIX).sort();
    expect(keys).toEqual(
      [
        "TRANSACTION",
        "GOAL",
        "BUDGET",
        "SALARY",
        "RETIREMENT",
        "MILESTONE",
        "PROGRESS_GOAL",
      ].sort(),
    );
  });
});
