// Note 1: These route tests focus on user isolation rather than UI rendering.
// Mocking the auth and DynamoDB layers lets the suite assert that import/export
// and reports queries stay bound to the authenticated Cognito subject.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requestUser", () => ({
  getRequestUserId: vi.fn(),
}));

vi.mock("@/lib/api/dynamo", () => ({
  getUserTransactions: vi.fn(),
  putTransaction: vi.fn(),
}));

import { GET as getReports } from "../../app/api/reports/route";
import { GET as exportReports } from "../../app/api/reports/export/route";
import { POST as importReports } from "../../app/api/reports/import/route";
import { getUserTransactions, putTransaction } from "@/lib/api/dynamo";
import { getRequestUserId } from "@/lib/auth/requestUser";
import type { Transaction } from "../../lib/types/types";

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

  it("supports multi-year filters on the reports route", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-a");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("tx-2025", { date: "2025-01-15", amount: 25 }),
      buildTransaction("tx-2024", { date: "2024-01-15", amount: 30 }),
      buildTransaction("tx-2023", { date: "2023-01-15", amount: 35 }),
    ]);

    const response = await getReports(
      new Request(
        "http://localhost/api/reports?years=2025,2023&page=1&pageSize=10&includeAggregates=true",
      ) as any,
    );

    await expect(response.json()).resolves.toMatchObject({
      totalCount: 2,
      transactions: [
        expect.objectContaining({ id: "tx-2025" }),
        expect.objectContaining({ id: "tx-2023" }),
      ],
      aggregates: expect.objectContaining({
        totalAmount: 60,
        spendingAmount: 60,
      }),
    });
  });

  it("supports category filters on the reports route", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-a");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("need", {
        amount: 25,
        category: "Need",
      }),
      buildTransaction("want", {
        amount: 30,
        category: "Want",
      }),
      buildTransaction("saving", {
        amount: 40,
        category: "Saving",
      }),
    ]);

    const response = await getReports(
      new Request(
        "http://localhost/api/reports?categories=Need,Saving&page=1&pageSize=10&includeAggregates=true",
      ) as any,
    );

    await expect(response.json()).resolves.toMatchObject({
      totalCount: 2,
      transactions: [
        expect.objectContaining({ id: "need" }),
        expect.objectContaining({ id: "saving" }),
      ],
      aggregates: expect.objectContaining({
        totalAmount: 65,
        spendingAmount: 25,
      }),
    });
  });

  it("supports income category filters and income-aware aggregates on the reports route", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-income");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("income", {
        amount: 2500,
        category: "Income",
        name: "Employer",
      }),
      buildTransaction("need", {
        amount: 200,
        category: "Need",
        name: "Rent",
      }),
    ]);

    const response = await getReports(
      new Request(
        "http://localhost/api/reports?categories=Income&page=1&pageSize=10&includeAggregates=true",
      ) as any,
    );

    await expect(response.json()).resolves.toMatchObject({
      totalCount: 1,
      transactions: [expect.objectContaining({ id: "income" })],
      aggregates: expect.objectContaining({
        totalAmount: 2500,
        spendingAmount: 0,
        incomeAmount: 2500,
      }),
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

  it("exports only the authenticated user's selected categories", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-b");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("tx-need", {
        name: "Rent",
        amount: 1200,
        category: "Need",
      }),
      buildTransaction("tx-saving", {
        name: "Emergency Fund",
        amount: 300,
        category: "Saving",
      }),
    ]);

    const response = await exportReports(
      new Request(
        "http://localhost/api/reports/export?categories=Saving",
      ) as any,
    );
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(csv).toContain('"Emergency Fund"');
    expect(csv).not.toContain('"Rent"');
  });

  it("exports only the authenticated user's income transactions when filtered by income", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-b");
    mockedGetUserTransactions.mockResolvedValue([
      buildTransaction("tx-income", {
        name: "Employer",
        amount: 2500,
        category: "Income",
      }),
      buildTransaction("tx-need", {
        name: "Rent",
        amount: 1200,
        category: "Need",
      }),
    ]);

    const response = await exportReports(
      new Request(
        "http://localhost/api/reports/export?categories=Income",
      ) as any,
    );
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(csv).toContain('"Employer"');
    expect(csv).toContain('"Income"');
    expect(csv).not.toContain('"Rent"');
  });

  it("imports income CSV rows into the authenticated user's account", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-c-income");
    mockedPutTransaction.mockResolvedValue({} as never);

    const csv = [
      "Source,Amount,Pay Date",
      'Employer,"$2,500.00",2025-02-01',
      "Tax Refund,$80.00,02/26/2025",
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
      "user-c-income",
      expect.objectContaining({
        name: "Employer",
        amount: 2500,
        category: "Income",
        date: "2025-02-01",
      }),
    );
    expect(mockedPutTransaction).toHaveBeenNthCalledWith(
      2,
      "user-c-income",
      expect.objectContaining({
        name: "Tax Refund",
        amount: 80,
        category: "Income",
        date: "2025-02-26",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      importedCount: 2,
      skipped: [],
    });
  });

  // Note 2: The GET /api/reports route re-throws Response objects thrown by
  // getRequestUserId so a 401 from auth flows through to the caller unchanged.
  it("returns 401 when the reports request is not authenticated", async () => {
    mockedGetRequestUserId.mockRejectedValue(
      new Response(
        JSON.stringify({
          error: { code: "unauthorized", message: "Missing token" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await getReports(
      new Request("http://localhost/api/reports") as any,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "unauthorized" },
    });
  });

  it("returns an empty result set when the user has no transactions", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-empty");
    mockedGetUserTransactions.mockResolvedValue([]);

    const response = await getReports(
      new Request(
        "http://localhost/api/reports?page=1&pageSize=10&includeAggregates=true",
      ) as any,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      totalCount: 0,
      transactions: [],
      aggregates: expect.objectContaining({ totalAmount: 0 }),
    });
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
