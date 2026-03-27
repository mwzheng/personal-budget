import { describe, expect, it } from "vitest";
import { selectLatestFireScenario } from "@/lib/utils/fire-scenarios";
import type { FireScenario } from "@/lib/types/types";

function buildScenario(overrides?: Partial<FireScenario>): FireScenario {
  return {
    scenarioId: "scenario-1",
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

describe("selectLatestFireScenario", () => {
  it("prefers the most recent updatedAt timestamp", () => {
    const latest = selectLatestFireScenario([
      buildScenario({
        scenarioId: "scenario-1",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      buildScenario({
        scenarioId: "scenario-2",
        updatedAt: "2026-02-01T00:00:00.000Z",
      }),
    ]);

    expect(latest?.scenarioId).toBe("scenario-2");
  });

  it("falls back to createdAt when updatedAt is unavailable", () => {
    const latest = selectLatestFireScenario([
      buildScenario({
        scenarioId: "scenario-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      buildScenario({
        scenarioId: "scenario-2",
        createdAt: "2026-03-01T00:00:00.000Z",
      }),
    ]);

    expect(latest?.scenarioId).toBe("scenario-2");
  });

  it("uses the returned list order when timestamps are unavailable", () => {
    const latest = selectLatestFireScenario([
      buildScenario({ scenarioId: "scenario-1" }),
      buildScenario({ scenarioId: "scenario-2" }),
      buildScenario({ scenarioId: "scenario-3" }),
    ]);

    expect(latest?.scenarioId).toBe("scenario-3");
  });

  it("returns null for an empty scenario list", () => {
    expect(selectLatestFireScenario([])).toBeNull();
  });
});
