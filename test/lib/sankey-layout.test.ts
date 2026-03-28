import { describe, expect, it } from "vitest";

import { getSankeyLayoutMetrics } from "../../lib/utils/sankey-layout";
import { SankeyData } from "../../lib/types/types";

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
    expect(largeMetrics.leftMargin).toBeGreaterThanOrEqual(56);
    expect(largeMetrics.rightMargin).toBeGreaterThan(largeMetrics.leftMargin);
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
    expect(metrics.height).toBeLessThan(1200);
    expect(metrics.height).toBeGreaterThanOrEqual(540);
    expect(metrics.chartMaxWidth).toBeGreaterThanOrEqual(900);
    expect(metrics.chartMaxWidth).toBeLessThanOrEqual(1360);
  });

  it("keeps labels readable while preserving softer chart framing", () => {
    const longLabelData: SankeyData = {
      nodes: [
        { id: "income", label: "Net Income" },
        {
          id: "essentials",
          label: "Core Living Essentials and Monthly Bills",
        },
        {
          id: "expense:essentials",
          label: "Rent, Utilities, Insurance, and Groceries",
        },
      ],
      links: [
        { source: "income", target: "essentials", value: 2500 },
        { source: "essentials", target: "expense:essentials", value: 2500 },
      ],
    };

    const metrics = getSankeyLayoutMetrics(longLabelData);

    expect(metrics.labelFontSize).toBe(11);
    expect(metrics.leftMargin).toBeGreaterThanOrEqual(56);
    expect(metrics.rightMargin).toBeLessThanOrEqual(320);
  });
});
