// Tests exercise app/api/transactions/route.ts at the HTTP boundary so auth
// behavior, payload handling, and ID generation stay covered even if the
// DynamoDB helpers or utility internals are refactored later.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requestUser", () => ({
  getRequestUserId: vi.fn(),
}));

vi.mock("@/lib/api/dynamo", () => ({
  deleteTransaction: vi.fn(),
  getUserTransactions: vi.fn(),
  putTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));

vi.mock("@/lib/utils/generateId", () => ({
  generateId: vi.fn(),
}));

import { DELETE, GET, POST, PUT } from "@/app/api/transactions/route";
import {
  deleteTransaction,
  getUserTransactions,
  putTransaction,
  updateTransaction,
} from "@/lib/api/dynamo";
import { getRequestUserId } from "@/lib/auth/requestUser";
import { generateId } from "@/lib/utils/generateId";

const mockedDeleteTransaction = vi.mocked(deleteTransaction);
const mockedGetUserTransactions = vi.mocked(getUserTransactions);
const mockedGetRequestUserId = vi.mocked(getRequestUserId);
const mockedPutTransaction = vi.mocked(putTransaction);
const mockedUpdateTransaction = vi.mocked(updateTransaction);
const mockedGenerateId = vi.mocked(generateId);

function buildRequest(
  url = "http://localhost/api/transactions",
  init?: RequestInit,
) {
  return new Request(url, init);
}

describe("transactions api route", () => {
  beforeEach(() => {
    mockedDeleteTransaction.mockReset();
    mockedGetUserTransactions.mockReset();
    mockedGetRequestUserId.mockReset();
    mockedPutTransaction.mockReset();
    mockedUpdateTransaction.mockReset();
    mockedGenerateId.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── GET ──────────────────────────────────────────────────────────────

  it("returns the authenticated user's transactions", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-100");
    mockedGetUserTransactions.mockResolvedValue([
      {
        id: "tx-1",
        name: "Coffee",
        amount: 50,
        date: "2026-01-15",
        category: "Want",
        notes: "",
        paymentMethod: "card",
        tags: [],
      },
      {
        id: "tx-2",
        name: "Rent",
        amount: 120,
        date: "2026-01-16",
        category: "Need",
        notes: "",
        paymentMethod: "bank",
        tags: [],
      },
    ]);

    const response = await GET(buildRequest());

    expect(mockedGetRequestUserId).toHaveBeenCalledTimes(1);
    expect(mockedGetUserTransactions).toHaveBeenCalledWith("user-100");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      transactions: [
        {
          id: "tx-1",
          name: "Coffee",
          amount: 50,
          date: "2026-01-15",
          category: "Want",
          notes: "",
          paymentMethod: "card",
          tags: [],
        },
        {
          id: "tx-2",
          name: "Rent",
          amount: 120,
          date: "2026-01-16",
          category: "Need",
          notes: "",
          paymentMethod: "bank",
          tags: [],
        },
      ],
    });
  });

  it("returns 401 when authentication fails on GET", async () => {
    mockedGetRequestUserId.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    const response = await GET(buildRequest());

    expect(mockedGetUserTransactions).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Missing or invalid Authorization header",
    });
  });

  // ── POST ─────────────────────────────────────────────────────────────

  it("creates a transaction with an auto-generated ID when none is provided", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-200");
    mockedGenerateId.mockReturnValue("generated-uuid-1");
    mockedPutTransaction.mockResolvedValue(undefined as never);

    const response = await POST(
      buildRequest("http://localhost/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 75,
          date: "2026-02-10",
          category: "Groceries",
        }),
      }),
    );

    expect(mockedGenerateId).toHaveBeenCalledTimes(1);
    expect(mockedPutTransaction).toHaveBeenCalledWith("user-200", {
      id: "generated-uuid-1",
      amount: 75,
      date: "2026-02-10",
      category: "Groceries",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      created: {
        id: "generated-uuid-1",
        amount: 75,
        date: "2026-02-10",
        category: "Groceries",
      },
    });
  });

  it("creates a transaction with a user-provided ID without generating one", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-201");
    mockedPutTransaction.mockResolvedValue(undefined as never);

    const response = await POST(
      buildRequest("http://localhost/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "custom-id-99",
          amount: 200,
          date: "2026-03-01",
          category: "Rent",
        }),
      }),
    );

    expect(mockedGenerateId).not.toHaveBeenCalled();
    expect(mockedPutTransaction).toHaveBeenCalledWith("user-201", {
      id: "custom-id-99",
      amount: 200,
      date: "2026-03-01",
      category: "Rent",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      created: {
        id: "custom-id-99",
        amount: 200,
        date: "2026-03-01",
        category: "Rent",
      },
    });
  });

  // ── PUT ──────────────────────────────────────────────────────────────

  it("updates an existing transaction when id is provided", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-300");
    mockedUpdateTransaction.mockResolvedValue({
      id: "tx-update-1",
      name: "Utilities",
      amount: 999,
      date: "2026-04-20",
      category: "Need",
      notes: "",
      paymentMethod: "bank",
      tags: [],
    });

    const response = await PUT(
      buildRequest("http://localhost/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "tx-update-1",
          amount: 999,
          date: "2026-04-20",
          category: "Need",
        }),
      }),
    );

    expect(mockedUpdateTransaction).toHaveBeenCalledWith("user-300", {
      id: "tx-update-1",
      amount: 999,
      date: "2026-04-20",
      category: "Need",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updated: {
        id: "tx-update-1",
        amount: 999,
        date: "2026-04-20",
        category: "Need",
      },
    });
  });

  it("passes originalDate to the update helper when provided", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-300b");
    mockedUpdateTransaction.mockResolvedValue({
      id: "tx-update-2",
      amount: 10,
      date: "2026-08-03",
      category: "Need",
      name: "Lunch",
      notes: "",
      paymentMethod: "",
      tags: [],
    });

    const response = await PUT(
      buildRequest("http://localhost/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "tx-update-2",
          originalDate: "2026-07-31",
          amount: 10,
          date: "2026-08-03",
          category: "Need",
          name: "Lunch",
          notes: "",
          paymentMethod: "",
          tags: [],
        }),
      }),
    );

    expect(mockedUpdateTransaction).toHaveBeenCalledWith(
      "user-300b",
      {
        id: "tx-update-2",
        amount: 10,
        date: "2026-08-03",
        category: "Need",
        name: "Lunch",
        notes: "",
        paymentMethod: "",
        tags: [],
      },
      "2026-07-31",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updated: {
        id: "tx-update-2",
        amount: 10,
        date: "2026-08-03",
        category: "Need",
        name: "Lunch",
        notes: "",
        paymentMethod: "",
        tags: [],
      },
    });
  });

  it("rejects PUT when id is missing with 400", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-301");

    const response = await PUT(
      buildRequest("http://localhost/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 50,
          date: "2026-05-01",
          category: "Entertainment",
        }),
      }),
    );

    expect(mockedPutTransaction).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Missing id for update",
    });
  });

  // ── DELETE ───────────────────────────────────────────────────────────

  it("deletes a transaction using JSON body with id and date", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-400");
    mockedDeleteTransaction.mockResolvedValue(undefined as never);

    const response = await DELETE(
      buildRequest("http://localhost/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "tx-del-1", date: "2026-06-15" }),
      }),
    );

    expect(mockedDeleteTransaction).toHaveBeenCalledWith(
      "user-400",
      "tx-del-1",
      "2026-06-15",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("deletes a transaction using query parameters for id and date", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-401");
    mockedDeleteTransaction.mockResolvedValue(undefined as never);

    const response = await DELETE(
      buildRequest(
        "http://localhost/api/transactions?id=tx-del-2&date=2026-07-20",
        { method: "DELETE" },
      ),
    );

    expect(mockedDeleteTransaction).toHaveBeenCalledWith(
      "user-401",
      "tx-del-2",
      "2026-07-20",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects DELETE when id or date is missing with 400", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-402");

    const response = await DELETE(
      buildRequest("http://localhost/api/transactions?id=tx-del-3", {
        method: "DELETE",
      }),
    );

    expect(mockedDeleteTransaction).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Missing id or date",
    });
  });
});
