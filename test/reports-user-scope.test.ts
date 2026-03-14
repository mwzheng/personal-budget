// Note 1: These route tests focus on user isolation rather than UI rendering.
// Mocking the auth and DynamoDB layers lets the suite assert that import/export
// and reports queries stay bound to the authenticated Cognito subject.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/requestUser", () => ({
  getRequestUserId: vi.fn(),
}));

vi.mock("@/lib/dynamo", () => ({
  getUserTransactions: vi.fn(),
  putTransaction: vi.fn(),
}));

import { GET as getReports } from "../app/api/reports/route";
import { GET as exportReports } from "../app/api/reports/export/route";
import { POST as importReports } from "../app/api/reports/import/route";
import { getUserTransactions, putTransaction } from "@/lib/dynamo";
import { getRequestUserId } from "@/lib/requestUser";
import type { Transaction } from "../lib/types";

const mockedGetRequestUserId = vi.mocked(getRequestUserId);
const mockedGetUserTransactions = vi.mocked(getUserTransactions);
const mockedPutTransaction = vi.mocked(putTransaction);

function buildTransaction(
  id: string,
  overrides?: Partial<Transaction>,
): Transaction {
  return {
    id,
    name: `transaction-${id}`,
    amount: 10,
    category: "Need",
    date: "2025-01-15",
    notes: "",
    paymentMethod: "card",
    tags: [],
    ...overrides,
  };
}

describe("reports routes user scoping", () => {
  beforeEach(() => {
    mockedGetRequestUserId.mockReset();
    mockedGetUserTransactions.mockReset();
    mockedPutTransaction.mockReset();
  });

  it("filters reports using only the authenticated user's transactions", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-a");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("tx-1", {
        name: "Groceries",
        amount: 25,
        tags: ["food"],
      }),
      buildTransaction("tx-2", {
        name: "Fuel",
        amount: 50,
        tags: ["car"],
      }),
    ]);

    const response = await getReports(
      new Request(
        "http://localhost/api/reports?search=groc&page=1&pageSize=10&includeAggregates=true",
      ) as any,
    );

    expect(mockedGetRequestUserId).toHaveBeenCalledTimes(1);
    expect(mockedGetUserTransactions).toHaveBeenCalledWith("user-a");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      totalCount: 1,
      transactions: [expect.objectContaining({ name: "Groceries" })],
      aggregates: expect.objectContaining({ totalAmount: 25 }),
    });
  });

  it("exports only the authenticated user's filtered transactions", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-b");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("tx-1", {
        name: "Rent",
        amount: 1200,
        tags: ["housing"],
      }),
      buildTransaction("tx-2", {
        name: "Dining",
        amount: 45,
        tags: ["food"],
      }),
    ]);

    const response = await exportReports(
      new Request("http://localhost/api/reports/export?tags=housing") as any,
    );
    const csv = await response.text();

    expect(mockedGetUserTransactions).toHaveBeenCalledWith("user-b");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(csv).toContain('"Rent"');
    expect(csv).not.toContain('"Dining"');
  });

  it("imports CSV rows into the authenticated user's account", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-c");
    mockedPutTransaction.mockResolvedValue({} as never);

    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      'Coffee,$4.50,Want,2025-02-01,,Card,"morning"',
      'Bus,$2.75,Need,2025-02-02,,Transit,"commute"',
    ].join("\n");

    const response = await importReports(
      new Request("http://localhost/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      }) as any,
    );

    expect(mockedPutTransaction).toHaveBeenCalledTimes(2);
    expect(mockedPutTransaction).toHaveBeenNthCalledWith(
      1,
      "user-c",
      expect.objectContaining({
        id: expect.any(String),
        name: "Coffee",
        amount: 4.5,
      }),
    );
    expect(mockedPutTransaction).toHaveBeenNthCalledWith(
      2,
      "user-c",
      expect.objectContaining({
        id: expect.any(String),
        name: "Bus",
        amount: 2.75,
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      importedCount: 2,
      skipped: [],
    });
  });
});
