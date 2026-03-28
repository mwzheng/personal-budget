// Tests for the /api/sankey POST route handler. This route is pure computation
// (Zod validation + percentage normalisation) with no auth or database
// dependencies, so tests call the handler directly with NextRequest objects.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/sankey/route";

function buildSankeyRequest(body: unknown) {
  return new NextRequest("http://localhost/api/sankey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("sankey api route", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Happy-path tests ---

  it("returns sankey data for valid percentage-based allocations (50/30/20)", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 5000,
        incomeLabel: "Salary",
        allocations: [
          { category: "Needs", percentage: 50 },
          { category: "Wants", percentage: 30 },
          { category: "Savings", percentage: 20 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.sankeyData.nodes).toEqual([
      { id: "Salary" },
      { id: "Needs" },
      { id: "Wants" },
      { id: "Savings" },
    ]);
    expect(data.sankeyData.links).toEqual([
      { source: "Salary", target: "Needs", value: 2500 },
      { source: "Salary", target: "Wants", value: 1500 },
      { source: "Salary", target: "Savings", value: 1000 },
    ]);
    expect(data.budgetSuggestion).toEqual({
      Needs: 2500,
      Wants: 1500,
      Savings: 1000,
    });
  });

  it("returns sankey data for amount-based allocations that sum to 100 (legacy)", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 4000,
        incomeLabel: "Income",
        allocations: [
          { category: "Housing", amount: 50 },
          { category: "Food", amount: 30 },
          { category: "Transport", amount: 20 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Amounts summing to 100 are treated as percentages directly (legacy path).
    expect(data.sankeyData.nodes).toEqual([
      { id: "Income" },
      { id: "Housing" },
      { id: "Food" },
      { id: "Transport" },
    ]);
    expect(data.sankeyData.links).toEqual([
      { source: "Income", target: "Housing", value: 2000 },
      { source: "Income", target: "Food", value: 1200 },
      { source: "Income", target: "Transport", value: 800 },
    ]);
    expect(data.budgetSuggestion).toEqual({
      Housing: 2000,
      Food: 1200,
      Transport: 800,
    });
  });

  it("returns sankey data for amount-based allocations that need scaling", async () => {
    // Amounts 500 + 300 + 200 = 1000 → scaled to 50%, 30%, 20%
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 10000,
        incomeLabel: "Salary",
        allocations: [
          { category: "Rent", amount: 500 },
          { category: "Groceries", amount: 300 },
          { category: "Fun", amount: 200 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.sankeyData.links).toEqual([
      { source: "Salary", target: "Rent", value: 5000 },
      { source: "Salary", target: "Groceries", value: 3000 },
      { source: "Salary", target: "Fun", value: 2000 },
    ]);
    expect(data.budgetSuggestion).toEqual({
      Rent: 5000,
      Groceries: 3000,
      Fun: 2000,
    });
  });

  it("filters out zero-percentage allocations from nodes and links but keeps them in budgetSuggestion", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 3000,
        incomeLabel: "Income",
        allocations: [
          { category: "Essentials", percentage: 70 },
          { category: "Unused", percentage: 0 },
          { category: "Savings", percentage: 30 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // "Unused" should be excluded from nodes and links.
    expect(data.sankeyData.nodes).toEqual([
      { id: "Income" },
      { id: "Essentials" },
      { id: "Savings" },
    ]);
    expect(data.sankeyData.links).toEqual([
      { source: "Income", target: "Essentials", value: 2100 },
      { source: "Income", target: "Savings", value: 900 },
    ]);

    // budgetSuggestion includes ALL allocations, even zero.
    expect(data.budgetSuggestion).toEqual({
      Essentials: 2100,
      Unused: 0,
      Savings: 900,
    });
  });

  it("uses default 'Income' label when incomeLabel is not provided", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 6000,
        allocations: [
          { category: "Bills", percentage: 60 },
          { category: "Leisure", percentage: 40 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.sankeyData.nodes[0]).toEqual({ id: "Income" });
    expect(data.sankeyData.links[0].source).toBe("Income");
    expect(data.sankeyData.links[1].source).toBe("Income");
  });

  it("handles mixed percentage and amount allocations", async () => {
    // 60% is explicitly reserved; remaining 40% is split by amount weights
    // (300 + 100 = 400 total weight → Groceries gets 30%, Fun gets 10%).
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 5000,
        incomeLabel: "Pay",
        allocations: [
          { category: "Rent", percentage: 60 },
          { category: "Groceries", amount: 300 },
          { category: "Fun", amount: 100 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.sankeyData.nodes).toEqual([
      { id: "Pay" },
      { id: "Rent" },
      { id: "Groceries" },
      { id: "Fun" },
    ]);
    expect(data.sankeyData.links).toEqual([
      { source: "Pay", target: "Rent", value: 3000 },
      { source: "Pay", target: "Groceries", value: 1500 },
      { source: "Pay", target: "Fun", value: 500 },
    ]);
    expect(data.budgetSuggestion).toEqual({
      Rent: 3000,
      Groceries: 1500,
      Fun: 500,
    });
  });

  // --- Validation / rejection tests ---

  it("rejects when percentages do not sum to 100%", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 5000,
        incomeLabel: "Income",
        allocations: [
          { category: "A", percentage: 40 },
          { category: "B", percentage: 30 },
        ],
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe("INVALID_INPUT");
    expect(data.error.message).toContain("sum to 100%");
  });

  it("rejects when allocations are missing both percentage and amount", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 5000,
        incomeLabel: "Income",
        allocations: [{ category: "Oops" }],
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe("INVALID_INPUT");
  });

  it("rejects when monthlyIncome is missing or non-positive", async () => {
    // Missing monthlyIncome
    const responseMissing = await POST(
      buildSankeyRequest({
        incomeLabel: "Income",
        allocations: [{ category: "A", percentage: 100 }],
      }),
    );

    expect(responseMissing.status).toBe(400);
    const dataMissing = await responseMissing.json();
    expect(dataMissing.error.code).toBe("INVALID_INPUT");

    // Non-positive monthlyIncome
    const responseZero = await POST(
      buildSankeyRequest({
        monthlyIncome: 0,
        incomeLabel: "Income",
        allocations: [{ category: "A", percentage: 100 }],
      }),
    );

    expect(responseZero.status).toBe(400);
    const dataZero = await responseZero.json();
    expect(dataZero.error.code).toBe("INVALID_INPUT");
  });

  it("rejects when allocations array is empty", async () => {
    const response = await POST(
      buildSankeyRequest({
        monthlyIncome: 5000,
        incomeLabel: "Income",
        allocations: [],
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe("INVALID_INPUT");
  });
});
