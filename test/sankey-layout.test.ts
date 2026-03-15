import { describe, expect, it } from "vitest";

import { getSankeyLayoutMetrics } from "../lib/sankey-layout";
import { SankeyData } from "../lib/types";

/**
 * Note 1: These tests lock in the layout guardrails that keep the Sankey
 * compact. The recent regression came from exploding node width and spacing,
 * which made the graph look disconnected instead of improving readability.
 */
function createBudgetFlow(valueScale = 1): SankeyData {
  return {
    nodes: [
      { id: "income", label: "Net" },
      { id: "housing", label: "Housing" },
      { id: "utilities", label: "Utilities" },
      { id: "expense:housing", label: "Rent" },
      { id: "expense:utilities", label: "Electric" },
    ],
    links: [
      { source: "income", target: "housing", value: 1800 * valueScale },
      { source: "income", target: "utilities", value: 250 * valueScale },
      {
        source: "housing",
        target: "expense:housing",
        value: 1800 * valueScale,
      },
      {
        source: "utilities",
        target: "expense:utilities",
        value: 250 * valueScale,
      },
    ],
  };
}

describe("getSankeyLayoutMetrics", () => {
  it("keeps node width bounded even when flow values are much larger", () => {
    const normalMetrics = getSankeyLayoutMetrics(createBudgetFlow(1));
    const largeMetrics = getSankeyLayoutMetrics(createBudgetFlow(100));

    expect(normalMetrics.nodeThickness).toBe(largeMetrics.nodeThickness);
    expect(largeMetrics.nodeThickness).toBeLessThanOrEqual(18);
    expect(largeMetrics.nodeSpacing).toBeLessThanOrEqual(18);
  });

  it("keeps dense layers readable without runaway height or spacing", () => {
    const denseData: SankeyData = {
      nodes: [
        { id: "income", label: "Net" },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: `expense:${index}`,
          label: `Expense ${index + 1}`,
        })),
      ],
      links: Array.from({ length: 10 }, (_, index) => ({
        source: "income",
        target: `expense:${index}`,
        value: 100 + index * 25,
      })),
    };

    const metrics = getSankeyLayoutMetrics(denseData);

    expect(metrics.nodeSpacing).toBeLessThanOrEqual(14);
    expect(metrics.height).toBeLessThan(920);
    expect(metrics.height).toBeGreaterThanOrEqual(420);
  });
});
