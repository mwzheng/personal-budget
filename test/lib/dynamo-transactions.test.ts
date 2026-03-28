// Note 1: These tests protect the transaction-query builder from regressing back
// to a "read the whole user partition" query, which would leak salary/progress
// entities into reports and transaction tables in the single-table schema.
// Note 2: Additional tests cover the no-client fallback paths (TABLE_NAME empty
// in test environments) and the mock-client paths for write/delete operations so
// the DynamoDB item shape and sort-key construction stay verifiable without
// touching real AWS infrastructure.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Note 3: vi.hoisted ensures the sendMock reference is available before module
// imports are processed. getDocClientMock is separately controlled per test so
// "no client" and "with client" scenarios can be asserted independently.
const { sendMock, getDocClientMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getDocClientMock: vi.fn(),
}));

vi.mock("@/lib/api/dynamoClient", () => ({
  getDocClient: getDocClientMock,
}));

import {
  buildTransactionsQuery,
  deleteTransaction,
  getUserBudgets,
  getUserGoals,
  getUserMonthlyAggregates,
  getUserTransactions,
  putGoal,
  putTransaction,
} from "../lib/api/dynamo";
import { DEMO_USER_ID } from "../lib/auth/requestUser";

describe("buildTransactionsQuery", () => {
  it("restricts non-ranged queries to transaction sort keys", () => {
    const query = buildTransactionsQuery("user-123");

    expect(query.KeyConditionExpression).toBe(
      "#pk = :pk and begins_with(#sk, :prefix)",
    );
    expect(query.ExpressionAttributeValues).toMatchObject({
      ":pk": "user#user-123",
      ":prefix": "date#",
    });
  });

  it("uses a date-key range when explicit bounds are provided", () => {
    const query = buildTransactionsQuery("user-123", {
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });

    expect(query.KeyConditionExpression).toBe(
      "#pk = :pk and #sk BETWEEN :skStart and :skEnd",
    );
    expect(query.ExpressionAttributeValues).toMatchObject({
      ":pk": "user#user-123",
      ":skStart": "date#2025-01-01#",
      ":skEnd": "date#2025-12-31#\uffff",
    });
  });

  // Note 4: When only startDate is supplied the query must still be bounded so
  // it does not scan the entire partition from that date onward indefinitely.
  it("applies a far-future end sentinel when only startDate is supplied", () => {
    const query = buildTransactionsQuery("user-123", {
      startDate: "2025-06-01",
    });

    expect(query.KeyConditionExpression).toBe(
      "#pk = :pk and #sk BETWEEN :skStart and :skEnd",
    );
    expect(query.ExpressionAttributeValues).toMatchObject({
      ":skStart": "date#2025-06-01#",
      ":skEnd": "date#9999-12-31#\uffff",
    });
  });

  it("applies a far-past start sentinel when only endDate is supplied", () => {
    const query = buildTransactionsQuery("user-789", {
      endDate: "2024-03-31",
    });

    expect(query.KeyConditionExpression).toBe(
      "#pk = :pk and #sk BETWEEN :skStart and :skEnd",
    );
    expect(query.ExpressionAttributeValues).toMatchObject({
      ":skStart": "date#0000-01-01#",
      ":skEnd": "date#2024-03-31#\uffff",
    });
  });
});

// Note 5: These tests exercise the fallback behaviour that fires when TABLE_NAME
// is not set (the default in the test environment). getDocClient returns null
// for an empty table name, which is the same runtime path on a cold Lambda that
// has not yet received its environment variables.
describe("getUserTransactions — no client fallback", () => {
  beforeEach(() => {
    getDocClientMock.mockReturnValue(null);
  });

  it("returns an empty array for a real (non-demo) user when DynamoDB is not configured", async () => {
    const transactions = await getUserTransactions("cognito-user-abc");

    expect(transactions).toEqual([]);
  });

  it("returns seeded CSV transactions for the demo user even without a DynamoDB client", async () => {
    // Note 6: The demo-user fallback reads sample-data/expenses.csv from disk
    // so smoke tests can validate the CSV without spinning up infrastructure.
    const transactions = await getUserTransactions(DEMO_USER_ID);

    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      amount: expect.any(Number),
      date: expect.any(String),
    });
  });
});

describe("getUserGoals and getUserBudgets — no client fallback", () => {
  beforeEach(() => {
    getDocClientMock.mockReturnValue(null);
  });

  it("returns an empty goals array when DynamoDB is not configured", async () => {
    const goals = await getUserGoals("user-xyz");
    expect(goals).toEqual([]);
  });

  it("returns an empty budgets array when DynamoDB is not configured", async () => {
    const budgets = await getUserBudgets("user-xyz");
    expect(budgets).toEqual([]);
  });

  it("returns an empty monthly-aggregates array when DynamoDB is not configured", async () => {
    const aggregates = await getUserMonthlyAggregates("user-xyz");
    expect(aggregates).toEqual([]);
  });
});

// Note 7: Write and delete operations must surface a clear error when the table
// is unconfigured rather than silently doing nothing, so callers can propagate
// the failure to the HTTP layer.
describe("write/delete operations throw when DynamoDB is not configured", () => {
  beforeEach(() => {
    getDocClientMock.mockReturnValue(null);
  });

  it("putTransaction throws a descriptive error", async () => {
    await expect(
      putTransaction("user-abc", {
        id: "tx-1",
        name: "Coffee",
        amount: 4.5,
        category: "Want",
        date: "2025-01-10",
        notes: "",
        paymentMethod: "card",
        tags: [],
      }),
    ).rejects.toThrow("DynamoDB table not configured");
  });

  it("deleteTransaction throws a descriptive error", async () => {
    await expect(
      deleteTransaction("user-abc", "tx-1", "2025-01-10"),
    ).rejects.toThrow("DynamoDB table not configured");
  });

  it("putGoal throws a descriptive error", async () => {
    await expect(
      putGoal("user-abc", { name: "Emergency Fund", targetAmount: 5000 }),
    ).rejects.toThrow("DynamoDB table not configured");
  });
});

// Note 8: With a mock DynamoDB client the tests can assert that the correct
// primary-key shape and attribute values are sent to the DocumentClient without
// running real network calls. sendMock captures the Command object so the test
// can inspect its `input` property.
describe("putTransaction — DynamoDB item shape", () => {
  beforeEach(() => {
    getDocClientMock.mockReturnValue({ send: sendMock });
    sendMock.mockReset();
    sendMock.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes the item with pk/sk derived from userId and transaction date+id", async () => {
    const tx = {
      id: "tx-abc",
      name: "Groceries",
      amount: 87.5,
      category: "Need" as const,
      date: "2025-03-15",
      notes: "Weekly shop",
      paymentMethod: "card",
      tags: ["food"],
    };

    const written = await putTransaction("user-1", tx);

    expect(sendMock).toHaveBeenCalledTimes(1);
    // Note 9: The sort-key encoding must embed the date so range queries work.
    expect(written.pk).toBe("user#user-1");
    expect(written.sk).toBe("date#2025-03-15#tx-abc");
    expect(written.id).toBe("tx-abc");
    expect(written.name).toBe("Groceries");
    expect(written.amount).toBe(87.5);
    expect(written.tags).toEqual(["food"]);
  });

  it("defaults optional fields (notes, paymentMethod, tags) to empty values", async () => {
    const tx = {
      id: "tx-minimal",
      name: "Bus fare",
      amount: 2.75,
      category: "Need" as const,
      date: "2025-04-01",
      notes: "",
      paymentMethod: "",
      tags: [],
    };

    const written = await putTransaction("user-2", tx);

    expect(written.notes).toBe("");
    expect(written.paymentMethod).toBe("");
    expect(written.tags).toEqual([]);
  });
});

describe("deleteTransaction — sort key construction", () => {
  beforeEach(() => {
    getDocClientMock.mockReturnValue({ send: sendMock });
    sendMock.mockReset();
    sendMock.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("derives the sort key from date and txId so the correct item is targeted", async () => {
    await deleteTransaction("user-1", "tx-abc", "2025-03-15");

    expect(sendMock).toHaveBeenCalledTimes(1);

    const [command] = sendMock.mock.calls[0] as [
      { input: { Key: { pk: string; sk: string } } },
    ];

    expect(command.input.Key).toEqual({
      pk: "user#user-1",
      sk: "date#2025-03-15#tx-abc",
    });
  });

  it("returns { ok: true } after a successful deletion", async () => {
    const result = await deleteTransaction("user-1", "tx-xyz", "2025-06-30");
    expect(result).toEqual({ ok: true });
  });
});
