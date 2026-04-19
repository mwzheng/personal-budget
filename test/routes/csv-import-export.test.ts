// Note 1: These tests pin the current CSV edge-case behavior at the smallest
// stable boundaries: pure parser/export helpers for data-shape rules, plus the
// import route for HTTP-level error handling and persistence orchestration.
import { readFileSync } from "fs";
import { join } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requestUser", () => ({
  getRequestUserId: vi.fn(),
}));

vi.mock("@/lib/api/dynamo", () => ({
  putTransaction: vi.fn(),
}));

import { putTransaction } from "@/lib/api/dynamo";
import { getRequestUserId } from "@/lib/auth/requestUser";
import { POST as importReports } from "@/app/api/reports/import/route";
import { transactionsToCsv } from "@/lib/utils/csvExport";
import { loadTransactionsFromCSV } from "@/lib/utils/csvParser";
import type { Transaction } from "@/lib/types/types";

const mockedGetRequestUserId = vi.mocked(getRequestUserId);
const mockedPutTransaction = vi.mocked(putTransaction);

describe("loadTransactionsFromCSV edge cases", () => {
  it("returns no transactions for empty content, header-only files, or missing required columns", () => {
    expect(loadTransactionsFromCSV("")).toEqual([]);
    expect(
      loadTransactionsFromCSV(
        "Name,Amount,Category,Date,Notes,Payment Method,Tags\n",
      ),
    ).toEqual([]);
    expect(
      loadTransactionsFromCSV(
        "Amount,Category,Date,Notes,Payment Method,Tags\n$3.50,Need,01/02/2025,,,",
      ),
    ).toEqual([]);
  });

  it("trims surrounding whitespace and strips Notion-style tag URLs", () => {
    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      '"  Coffee  "," $4.50 ",Need, 1/2/2025 ,"  morning run  ","  Card  "," groceries (https://notion.so/test), fun "',
    ].join("\n");

    expect(loadTransactionsFromCSV(csv)).toEqual([
      {
        id: "t-0",
        name: "Coffee",
        amount: 4.5,
        category: "Need",
        date: "2025-01-02",
        notes: "morning run",
        paymentMethod: "Card",
        tags: ["groceries", "fun"],
      },
    ]);
  });

  it("drops rows with invalid amounts or date strings that fail the parser's length check", () => {
    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      'Bad Amount,not-a-number,Want,01/02/2025,,Card,""',
      'Bad Date,$4.50,Want,2/1/25,,Card,""',
      'Negative,$-4.50,Want,01/02/2025,,Card,""',
      'Valid,$6.75,Saving,01/03/2025,,Card,""',
    ].join("\n");

    expect(loadTransactionsFromCSV(csv)).toEqual([
      expect.objectContaining({
        id: "t-3",
        name: "Valid",
        amount: 6.75,
        category: "Saving",
        date: "2025-01-03",
      }),
    ]);
  });

  it("keeps 10-character ISO dates instead of forcing MM/DD/YYYY input", () => {
    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      'Coffee,$4.50,Want,2025-01-02,,Card,"morning"',
    ].join("\n");

    expect(loadTransactionsFromCSV(csv)).toEqual([
      expect.objectContaining({
        id: "t-0",
        name: "Coffee",
        amount: 4.5,
        date: "2025-01-02",
      }),
    ]);
  });

  it("keeps duplicate rows as separate transactions with unique generated ids", () => {
    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      'Lunch,$12.00,Want,01/02/2025,,Card,"food"',
      'Lunch,$12.00,Want,01/02/2025,,Card,"food"',
    ].join("\n");

    expect(loadTransactionsFromCSV(csv)).toEqual([
      expect.objectContaining({ id: "t-0", name: "Lunch", amount: 12 }),
      expect.objectContaining({ id: "t-1", name: "Lunch", amount: 12 }),
    ]);
  });

  it("parses quoted commas, escaped quotes, and currency separators", () => {
    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      '"Rent, North","$1,234.56",Want,01/04/2025,"He said ""hello"" yesterday","Debit, card","housing, monthly"',
    ].join("\n");

    expect(loadTransactionsFromCSV(csv)).toEqual([
      {
        id: "t-0",
        name: "Rent, North",
        amount: 1234.56,
        category: "Want",
        date: "2025-01-04",
        notes: 'He said "hello" yesterday',
        paymentMethod: "Debit, card",
        tags: ["housing", "monthly"],
      },
    ]);
  });

  it("parses the income CSV schema into income transactions", () => {
    const csv = [
      "Source,Amount,Pay Date",
      'Employer,"$2,500.00",03/14/2025',
      "Tax Refund,$125.50,2025-03-20",
    ].join("\n");

    expect(loadTransactionsFromCSV(csv)).toEqual([
      {
        id: "t-0",
        name: "Employer",
        amount: 2500,
        category: "Income",
        date: "2025-03-14",
        notes: "",
        paymentMethod: "",
        tags: [],
      },
      {
        id: "t-1",
        name: "Tax Refund",
        amount: 125.5,
        category: "Income",
        date: "2025-03-20",
        notes: "",
        paymentMethod: "",
        tags: [],
      },
    ]);
  });
});

describe("CSV import template", () => {
  it("stays aligned with the parser schema and sample rows", () => {
    const template = readFileSync(
      join(process.cwd(), "public", "templates", "expenses-template.csv"),
      "utf-8",
    );

    expect(template.split(/\r?\n/, 1)[0]).toBe(
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
    );
    expect(loadTransactionsFromCSV(template)).toEqual([
      expect.objectContaining({
        id: "t-0",
        name: "Groceries",
        amount: 54.23,
        category: "Need",
        date: "2025-03-01",
        paymentMethod: "Card",
        tags: ["groceries", "home"],
      }),
      expect.objectContaining({
        id: "t-1",
        name: "Coffee",
        amount: 4.5,
        category: "Want",
        date: "2025-03-02",
        paymentMethod: "Card",
        tags: ["coffee", "treat"],
      }),
      expect.objectContaining({
        id: "t-2",
        name: "Emergency Fund",
        amount: 200,
        category: "Saving",
        date: "2025-03-03",
        paymentMethod: "Bank Transfer",
        tags: ["savings", "transfer"],
      }),
    ]);
  });

  it("provides an income template aligned with the income CSV parser schema", () => {
    const template = readFileSync(
      join(process.cwd(), "public", "templates", "income-template.csv"),
      "utf-8",
    );

    expect(template.split(/\r?\n/, 1)[0]).toBe("Source,Amount,Pay Date");
    expect(loadTransactionsFromCSV(template)).toEqual([
      expect.objectContaining({
        id: "t-0",
        name: "Employer Payroll",
        amount: 2450,
        category: "Income",
        date: "2025-03-14",
      }),
      expect.objectContaining({
        id: "t-1",
        name: "Freelance Project",
        amount: 450,
        category: "Income",
        date: "2025-03-21",
      }),
      expect.objectContaining({
        id: "t-2",
        name: "Tax Refund",
        amount: 125.5,
        category: "Income",
        date: "2025-03-28",
      }),
    ]);
  });
});

describe("transactionsToCsv edge cases", () => {
  it("quotes every field, escapes embedded quotes, and flattens note newlines", () => {
    const transactions: Transaction[] = [
      {
        id: "tx-1",
        name: 'Rent, "North"',
        amount: 1234.5,
        category: "Need",
        date: "2025-01-04",
        notes: 'Line 1\nHe said "hello"',
        paymentMethod: "Debit, card",
        tags: ["housing", "monthly"],
      },
    ];

    expect(transactionsToCsv(transactions)).toBe(
      [
        "Name,Amount,Category,Date,Notes,Payment Method,Tags",
        '"Rent, ""North""","$1234.50","Need","2025-01-04","Line 1 He said ""hello""","Debit, card","housing, monthly"',
      ].join("\n"),
    );
  });

  it("round-trips exported income transactions through the CSV parser", () => {
    const transactions: Transaction[] = [
      {
        id: "tx-income-1",
        name: "Paycheck",
        amount: 2100,
        category: "Income",
        date: "2025-03-14",
        notes: "",
        paymentMethod: "",
        tags: [],
      },
    ];

    expect(loadTransactionsFromCSV(transactionsToCsv(transactions))).toEqual([
      expect.objectContaining({
        id: "t-0",
        name: "Paycheck",
        amount: 2100,
        category: "Income",
        date: "2025-03-14",
      }),
    ]);
  });
});

describe("POST /api/reports/import edge cases", () => {
  beforeEach(() => {
    mockedGetRequestUserId.mockReset();
    mockedPutTransaction.mockReset();
  });

  it("returns 400 for an empty CSV payload", async () => {
    const response = await importReports(
      new Request("http://localhost/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: "   " }),
      }) as any,
    );

    expect(response.status).toBe(400);
    expect(mockedGetRequestUserId).not.toHaveBeenCalled();
    expect(mockedPutTransaction).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT", message: "No CSV payload provided" },
    });
  });

  it("accepts a header-only CSV and returns an empty import result", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-csv");

    const response = await importReports(
      new Request("http://localhost/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: "Name,Amount,Category,Date,Notes,Payment Method,Tags\n",
      }) as any,
    );

    expect(response.status).toBe(200);
    expect(mockedGetRequestUserId).toHaveBeenCalledTimes(1);
    expect(mockedPutTransaction).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      importedCount: 0,
      transactions: [],
      skipped: [],
    });
  });

  it("imports only parser-valid rows and silently drops rows the parser filters out", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-csv");
    mockedPutTransaction.mockResolvedValue({} as never);

    const csv = [
      "Name,Amount,Category,Date,Notes,Payment Method,Tags",
      'Coffee,$4.50,Want,2025-2-1,,Card,"morning"',
      ',$4.50,Want,2025-02-01,,Card,"missing-name"',
      'Tea,not-a-number,Want,2025-02-01,,Card,"bad-amount"',
      'Lunch,$12.00,Need,02/01/2025,,Card,"valid"',
    ].join("\n");

    const response = await importReports(
      new Request("http://localhost/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      }) as any,
    );

    expect(response.status).toBe(200);
    expect(mockedPutTransaction).toHaveBeenCalledTimes(1);
    expect(mockedPutTransaction).toHaveBeenCalledWith(
      "user-csv",
      expect.objectContaining({
        name: "Lunch",
        amount: 12,
        date: "2025-02-01",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      importedCount: 1,
      skipped: [],
      transactions: [expect.objectContaining({ name: "Lunch" })],
    });
  });

  it("imports income CSV rows into the authenticated user's account", async () => {
    mockedGetRequestUserId.mockResolvedValue("user-income");
    mockedPutTransaction.mockResolvedValue({} as never);

    const csv = [
      "Source,Amount,Pay Date",
      'Employer,"$2,500.00",03/14/2025',
      "Tax Refund,$125.50,03/21/2025",
    ].join("\n");

    const response = await importReports(
      new Request("http://localhost/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      }) as any,
    );

    expect(response.status).toBe(200);
    expect(mockedPutTransaction).toHaveBeenCalledTimes(2);
    expect(mockedPutTransaction).toHaveBeenNthCalledWith(
      1,
      "user-income",
      expect.objectContaining({
        name: "Employer",
        amount: 2500,
        category: "Income",
        date: "2025-03-14",
      }),
    );
    expect(mockedPutTransaction).toHaveBeenNthCalledWith(
      2,
      "user-income",
      expect.objectContaining({
        name: "Tax Refund",
        amount: 125.5,
        category: "Income",
        date: "2025-03-21",
      }),
    );
  });
});
