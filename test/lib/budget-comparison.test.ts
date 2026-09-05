import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculateBudgetComparison,
  monthBounds,
} from "@/lib/budget/comparison";
import { loadMonthlyTransactions } from "@/lib/budget/loadMonthlyTransactions";
import { apiFetch } from "@/lib/api/apiFetch";
import type { SavedBudget, Transaction } from "@/lib/types/types";
vi.mock("@/lib/api/apiFetch", () => ({ apiFetch: vi.fn() }));
const budget: SavedBudget = {
  name: "Plan",
  allocations: [
    { category: "Needs", amount: 100 },
    { category: "Wants", amount: 50 },
    { category: "Savings", amount: 20 },
  ],
};
function tx(
  id: string,
  amount: number,
  category: Transaction["category"] = "Need",
  date = "2024-02-29",
): Transaction {
  return {
    id,
    amount,
    category,
    date,
    name: id,
    tags: [],
    notes: "",
    paymentMethod: "card",
  };
}
describe("budget comparison", () => {
  it("normalizes legacy budgets, excludes income, and keeps savings separate", () => {
    const result = calculateBudgetComparison(
      budget,
      [
        tx("need", 110),
        tx("want", 20, "Want"),
        tx("save", 25, "Saving"),
        tx("income", 1000, "Income"),
      ],
      "2024-02",
    );
    expect(result.spending).toMatchObject({
      planned: 150,
      actual: 130,
      difference: 20,
      status: "remaining",
    });
    expect(result.categories.Need).toMatchObject({
      status: "over",
      difference: -10,
      progress: 100,
    });
    expect(result.categories.Saving).toMatchObject({
      actual: 25,
      difference: -5,
      status: "above-target",
      progress: 100,
    });
  });
  it("handles zero targets and empty months", () => {
    const zero = { name: "Empty", expenses: [] };
    const result = calculateBudgetComparison(zero, [tx("need", 2)], "2024-02");
    expect(result.categories.Need).toMatchObject({
      status: "unbudgeted",
      progress: 100,
    });
    expect(result.categories.Saving).toMatchObject({
      status: "no-target",
      progress: 0,
    });
    expect(
      calculateBudgetComparison(budget, [], "2024-02").transactionCount,
    ).toBe(0);
  });
  it("uses calendar boundaries including leap days", () => {
    expect(monthBounds("2024-02")).toEqual({
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    });
    expect(monthBounds("2025-02").endDate).toBe("2025-02-28");
    expect(monthBounds("2025-12").endDate).toBe("2025-12-31");
    expect(() => monthBounds("2024-13")).toThrow();
    expect(
      calculateBudgetComparison(
        budget,
        [
          tx("before", 1, "Need", "2024-01-31"),
          tx("first", 2, "Need", "2024-02-01"),
          tx("last", 3),
          tx("after", 9, "Need", "2024-03-01"),
        ],
        "2024-02",
      ).spending.actual,
    ).toBe(5);
  });
  it("sums rounded cents without floating point drift", () => {
    const result = calculateBudgetComparison(
      {
        name: "Cents",
        expenses: [
          { expenseId: "a", name: "a", category: "Need", amount: 0.1 },
          { expenseId: "b", name: "b", category: "Need", amount: 0.2 },
        ],
      },
      [tx("a", 0.1), tx("b", 0.2)],
      "2024-02",
    );
    expect(result.spending).toMatchObject({
      planned: 0.3,
      actual: 0.3,
      difference: 0,
    });
  });
});
describe("monthly transaction loader", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });
  function page(body: unknown) {
    return new Response(JSON.stringify(body));
  }
  it("follows all cursors and defensively removes demo records outside the month", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(
        page({
          ok: true,
          transactions: [tx("first", 1)],
          hasMore: true,
          nextCursor: "next",
        }),
      )
      .mockResolvedValueOnce(
        page({
          ok: true,
          transactions: [
            tx("second", 2),
            tx("outside", 3, "Need", "2024-03-01"),
          ],
          hasMore: false,
        }),
      );
    expect((await loadMonthlyTransactions("2024-02")).map((t) => t.id)).toEqual(
      ["first", "second"],
    );
    expect(vi.mocked(apiFetch).mock.calls[1][0]).toContain("cursor=next");
    expect(vi.mocked(apiFetch).mock.calls[0][0]).toContain(
      "endDate=2024-02-29",
    );
  });
  it("rejects incomplete and repeated pagination instead of returning partial totals", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      page({ ok: true, transactions: [tx("first", 1)], hasMore: true }),
    );
    await expect(loadMonthlyTransactions("2024-02")).rejects.toThrow(
      "incomplete",
    );
    vi.mocked(apiFetch).mockImplementation(async () =>
      page({ ok: true, transactions: [], nextCursor: "loop" }),
    );
    await expect(loadMonthlyTransactions("2024-02")).rejects.toThrow(
      "incomplete",
    );
  });
  it("rejects failed subsequent pages and respects cancellation", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(
        page({ ok: true, transactions: [tx("first", 1)], nextCursor: "next" }),
      )
      .mockResolvedValueOnce(new Response("error", { status: 500 }));
    await expect(loadMonthlyTransactions("2024-02")).rejects.toThrow(
      "Could not load",
    );
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadMonthlyTransactions("2024-02", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
