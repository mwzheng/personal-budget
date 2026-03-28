// Note 1: These tests exercise the budgets collection route at the HTTP boundary
// so auth failures, schema validation, and storage normalization stay covered
// even if the DynamoDB helpers or budget-planner internals are refactored later.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/auth", () => ({
  getUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/api/dynamo", () => ({
  getUserBudgets: vi.fn(),
  putBudget: vi.fn(),
  deleteBudget: vi.fn(),
}));

import { GET, POST } from "@/app/api/budgets/route";
import { DELETE, PUT } from "@/app/api/budgets/[id]/route";
import { getUserIdFromRequest } from "@/lib/auth/auth";
import { getUserBudgets, putBudget, deleteBudget } from "@/lib/api/dynamo";

const mockedGetUserIdFromRequest = vi.mocked(getUserIdFromRequest);
const mockedGetUserBudgets = vi.mocked(getUserBudgets);
const mockedPutBudget = vi.mocked(putBudget);
const mockedDeleteBudget = vi.mocked(deleteBudget);

function buildBudgetsRequest(init?: RequestInit) {
  return new Request("http://localhost/api/budgets", init);
}

describe("budgets api route", () => {
  beforeEach(() => {
    mockedGetUserIdFromRequest.mockReset();
    mockedGetUserBudgets.mockReset();
    mockedPutBudget.mockReset();
    mockedDeleteBudget.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:34:56.000Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns only the authenticated user's budgets", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-123");
    mockedGetUserBudgets.mockResolvedValue([
      {
        budgetId: "budget-1",
        name: "Home Budget",
        monthlyIncome: 5000,
        expenses: [
          {
            expenseId: "rent",
            name: "Rent",
            amount: 1800,
            category: "Need",
            group: "Housing",
          },
        ],
        allocations: [{ category: "Rent", amount: 1800 }],
      },
    ]);

    const response = await GET(buildBudgetsRequest());

    expect(mockedGetUserIdFromRequest).toHaveBeenCalledTimes(1);
    expect(mockedGetUserBudgets).toHaveBeenCalledWith("user-123");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      budgets: [
        {
          budgetId: "budget-1",
          name: "Home Budget",
          monthlyIncome: 5000,
          expenses: [
            {
              expenseId: "rent",
              name: "Rent",
              amount: 1800,
              category: "Need",
              group: "Housing",
            },
          ],
          allocations: [{ category: "Rent", amount: 1800 }],
        },
      ],
    });
  });

  it("creates a budget for the authenticated user after normalizing the payload", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-456");
    mockedPutBudget.mockImplementation(async (_userId, budget) => ({
      ...budget,
      budgetId: "budget-2",
    }));

    const response = await POST(
      buildBudgetsRequest({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Note 2: Whitespace-only names and zero/blank expense rows are valid
        // inputs to send from a partially edited form, but the route should store
        // the sanitized shape that downstream pages actually depend on.
        body: JSON.stringify({
          name: "   ",
          expenses: [
            {
              name: " Rent ",
              amount: 1800,
              category: "Need",
              group: " Housing ",
            },
            {
              name: "   ",
              amount: 10,
              category: "Want",
            },
            {
              name: "Streaming",
              amount: 20,
              category: "Want",
              group: "Subscriptions",
            },
          ],
        }),
      }),
    );

    expect(mockedPutBudget).toHaveBeenCalledTimes(1);
    expect(mockedPutBudget).toHaveBeenCalledWith("user-456", {
      budgetId: undefined,
      name: "Untitled budget",
      monthlyIncome: 1820,
      expenses: [
        {
          expenseId: expect.any(String),
          name: "Rent",
          amount: 1800,
          category: "Need",
          group: "Housing",
        },
        {
          expenseId: expect.any(String),
          name: "Streaming",
          amount: 20,
          category: "Want",
          group: "Subscriptions",
        },
      ],
      allocations: [
        { category: "Rent", amount: 1800 },
        { category: "Streaming", amount: 20 },
      ],
      createdAt: "2026-03-26T12:34:56.000Z",
      updatedAt: "2026-03-26T12:34:56.000Z",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      created: {
        budgetId: "budget-2",
        name: "Untitled budget",
        monthlyIncome: 1820,
        expenses: [
          expect.objectContaining({
            name: "Rent",
            amount: 1800,
            category: "Need",
            group: "Housing",
          }),
          expect.objectContaining({
            name: "Streaming",
            amount: 20,
            category: "Want",
            group: "Subscriptions",
          }),
        ],
        allocations: [
          { category: "Rent", amount: 1800 },
          { category: "Streaming", amount: 20 },
        ],
      },
    });
  });

  it("rejects invalid or missing payloads with the validation error shape", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-789");

    const response = await POST(
      buildBudgetsRequest({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        issues: {
          name: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        },
      },
    });
    expect(mockedPutBudget).not.toHaveBeenCalled();
  });

  it("preserves the route's get auth failure response", async () => {
    mockedGetUserIdFromRequest.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    const response = await GET(buildBudgetsRequest());

    expect(mockedGetUserBudgets).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Missing or invalid Authorization header",
    });
  });
});

describe("budgets [id] api route", () => {
  beforeEach(() => {
    mockedGetUserIdFromRequest.mockReset();
    mockedGetUserBudgets.mockReset();
    mockedPutBudget.mockReset();
    mockedDeleteBudget.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:34:56.000Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function buildBudgetByIdRequest(init?: RequestInit) {
    return new Request("http://localhost/api/budgets/budget-1", init);
  }

  it("deletes a budget by id for the authenticated user", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-123");
    mockedDeleteBudget.mockResolvedValue(undefined);

    const context = { params: Promise.resolve({ id: "budget-1" }) };
    const response = await DELETE(
      buildBudgetByIdRequest({ method: "DELETE" }),
      context,
    );

    expect(mockedGetUserIdFromRequest).toHaveBeenCalledTimes(1);
    expect(mockedDeleteBudget).toHaveBeenCalledWith("user-123", "budget-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns error response on auth failure for delete", async () => {
    mockedGetUserIdFromRequest.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    const context = { params: Promise.resolve({ id: "budget-1" }) };
    const response = await DELETE(
      buildBudgetByIdRequest({ method: "DELETE" }),
      context,
    );

    expect(mockedDeleteBudget).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Missing or invalid Authorization header",
    });
  });

  it("updates a budget with valid payload after schema validation and normalization", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-456");
    mockedPutBudget.mockImplementation(async (_userId, budget) => ({
      ...budget,
      budgetId: "budget-1",
    }));

    const context = { params: Promise.resolve({ id: "budget-1" }) };
    const response = await PUT(
      buildBudgetByIdRequest({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Budget",
          expenses: [
            {
              name: "Rent",
              amount: 1800,
              category: "Need",
              group: "Housing",
            },
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
        }),
      }),
      context,
    );

    expect(mockedPutBudget).toHaveBeenCalledTimes(1);
    expect(mockedPutBudget).toHaveBeenCalledWith("user-456", {
      budgetId: "budget-1",
      name: "Updated Budget",
      monthlyIncome: 1800,
      expenses: [
        {
          expenseId: expect.any(String),
          name: "Rent",
          amount: 1800,
          category: "Need",
          group: "Housing",
        },
      ],
      allocations: [{ category: "Rent", amount: 1800 }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-03-26T12:34:56.000Z",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      updated: {
        budgetId: "budget-1",
        name: "Updated Budget",
      },
    });
  });

  it("rejects invalid payload with 422 validation error on put", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-789");

    const context = { params: Promise.resolve({ id: "budget-1" }) };
    const response = await PUT(
      buildBudgetByIdRequest({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      context,
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        issues: {
          name: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        },
      },
    });
    expect(mockedPutBudget).not.toHaveBeenCalled();
  });
});
