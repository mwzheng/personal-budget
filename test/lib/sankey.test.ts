import { describe, it, expect } from "vitest";
import { normalizeAllocations } from "../../lib/utils/sankey";

describe("normalizeAllocations", () => {
  it("accepts explicit percentages that sum to 100", () => {
    const input = [
      { category: "Needs", percentage: 50 },
      { category: "Wants", percentage: 30 },
      { category: "Savings", percentage: 20 },
    ];
    const out = normalizeAllocations(input as any);
    expect(out.map((o) => o.percentage)).toEqual([50, 30, 20]);
  });

  it("accepts amounts that already sum to 100 as percentages", () => {
    const input = [
      { category: "A", amount: 60 },
      { category: "B", amount: 40 },
    ];
    const out = normalizeAllocations(input as any);
    expect(out.map((o) => Math.round(o.percentage))).toEqual([60, 40]);
  });

  it("scales amounts that do not sum to 100 into percentages summing to 100", () => {
    const input = [
      { category: "X", amount: 3 },
      { category: "Y", amount: 1 },
    ];
    const out = normalizeAllocations(input as any);
    // 3/(3+1)=0.75 -> 75%, 25%
    expect(out.map((o) => Math.round(o.percentage))).toEqual([75, 25]);
  });

  it("mixes provided percentages with amount-weights correctly", () => {
    const input = [
      { category: "A", percentage: 40 },
      { category: "B", amount: 3 },
      { category: "C", amount: 2 },
    ];
    const out = normalizeAllocations(input as any);
    // missingPct = 60 -> B: 3/5*60 = 36, C: 24
    const rounded = out.map((o) => Math.round(o.percentage));
    expect(rounded).toEqual([40, 36, 24]);
  });
});
