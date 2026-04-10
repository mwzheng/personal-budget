// Note 1: The AWS SDK v3 for JavaScript uses a modular design. `DynamoDBClient`
// is the low-level HTTP client, while `DynamoDBDocumentClient` is a higher-level
// wrapper that automatically marshals JavaScript types (strings, numbers, arrays)
// to and from DynamoDB's native AttributeValue format.
import {
  QueryCommand,
  PutCommand,
  DeleteCommand,
  NativeAttributeValue,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { getDocClient } from "./dynamoClient";
import { readFileSync } from "fs";
import { join } from "path";
import { loadTransactionsFromCSV } from "../utils/csvParser";
import { isDemoUserId } from "../auth/requestUser";
import { generateId } from "../utils/generateId";
import type { Goal, Transaction } from "../types/types";
import { SK_PREFIX } from "./tableKeys";

// Note 2: Reading the table name from an environment variable means the same
// code can be deployed to dev, staging, and production without changes -- only
// the environment variable value differs per environment.
const TABLE_NAME = process.env.DYNAMODB_TABLE || "";

// Note 3: Client initialization is handled by the shared `dynamoClient` module.
// See `lib/api/dynamoClient.ts` for caching and lazy-init details.

// Note 5: The DynamoDB table uses a single-table design with a composite primary
// key: `pk` (partition key) and `sk` (sort key). All data for a user shares the
// same `pk = "user#<userId>"`, and different entity types are distinguished by
// the `sk` prefix (e.g. "date#...", "goal#...", "budget#...").
// Note 5a: Reports must only read items whose sort key starts with `date#`. That
// guard prevents progress/salary/milestone entities in the same partition from
// leaking into transaction charts and tables.
export function buildTransactionsQuery(
  userId: string,
  opts?: { startDate?: string; endDate?: string },
) {
  const pk = `user#${userId}`;
  const exprNames: Record<string, string> = { "#pk": "pk", "#sk": "sk" };

  if (opts?.startDate || opts?.endDate) {
    const start = opts.startDate || "0000-01-01";
    const end = opts.endDate || "9999-12-31";
    return {
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk and #sk BETWEEN :skStart and :skEnd",
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: {
        ":pk": pk,
        ":skStart": `${SK_PREFIX.TRANSACTION}${start}#`,
        ":skEnd": `${SK_PREFIX.TRANSACTION}${end}#\uffff`,
      },
    } as const;
  }

  return {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: exprNames,
    ExpressionAttributeValues: { ":pk": pk, ":prefix": SK_PREFIX.TRANSACTION },
  } as const;
}

export async function getUserTransactions(
  userId: string,
): Promise<Transaction[]> {
  const client = getDocClient(TABLE_NAME);
  if (!client) {
    // Note 5: The sample CSV is only safe for the explicit demo user. Returning it
    // for authenticated Cognito users would leak the same shared dataset across
    // accounts, so real users get an empty list when DynamoDB is unavailable.
    if (!isDemoUserId(userId)) {
      return [];
    }

    const csvPath = join(process.cwd(), "sample-data", "expenses.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    return loadTransactionsFromCSV(csvContent);
  }

  // Note 6: Querying with `begins_with(#sk, "date#")` keeps the single-table
  // design safe: the user partition can store many entity types, but reports and
  // transactions pages should only hydrate true transaction records here.
  const params = buildTransactionsQuery(userId);

  const res = await client.send(new QueryCommand(params));
  // Note 7: `res.Items` may be undefined if no items match the query.
  // The `?? []` nullish coalescing operator provides a safe empty array default.
  const items = (res.Items ?? []) as Record<string, unknown>[];

  // Note 8: Each item from DynamoDB is typed as `Record<string, unknown>` because
  // DynamoDB does not know our TypeScript types. Mapping with explicit String() and
  // Number() casts converts DynamoDB's internal types to the plain JS values
  // expected by the Transaction interface.
  const txs: Transaction[] = items.map((item) => {
    const tags = Array.isArray(item.tags)
      ? (item.tags as unknown[]).map((t) => String(t))
      : [];
    return {
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      amount: Number(item.amount ?? 0),
      category: String(item.category ?? "Want") as Transaction["category"],
      date: String(item.date ?? ""),
      notes: String(item.notes ?? ""),
      paymentMethod: String(item.paymentMethod ?? ""),
      tags,
    } as Transaction;
  });

  return txs;
}

// Note 9: `getUserTransactionsPaged` uses DynamoDB's cursor-based pagination.
// Each query can return at most `Limit` items, and `LastEvaluatedKey` in the
// response is an opaque cursor that can be passed as `ExclusiveStartKey` in the
// next request to continue from where the previous page left off.
export async function getUserTransactionsPaged(
  userId: string,
  opts?: {
    limit?: number;
    lastKey?: Record<string, NativeAttributeValue>;
    startDate?: string;
    endDate?: string;
  },
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  // Note 10: The shared query builder keeps the "transactions only" constraint in
  // one place, so both full and paginated readers stay aligned when the schema grows.
  const query = buildTransactionsQuery(userId, opts);
  // Note 11: `ScanIndexForward: false` returns items in descending sort key
  // order (newest dates first). This is typically what users expect when
  // browsing recent transactions.
  const params: QueryCommandInput = {
    ...query,
    ScanIndexForward: false,
  };
  if (opts?.limit) params.Limit = opts.limit;
  if (opts?.lastKey) params.ExclusiveStartKey = opts.lastKey;
  const res = await client.send(new QueryCommand(params));
  const items = res.Items ?? [];
  const txs = items.map(
    (item) =>
      ({
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        amount: Number(item.amount ?? 0),
        category: String(item.category ?? "Want") as Transaction["category"],
        date: String(item.date ?? ""),
        notes: String(item.notes ?? ""),
        paymentMethod: String(item.paymentMethod ?? ""),
        tags: Array.isArray(item.tags)
          ? (item.tags as NativeAttributeValue[]).map(String)
          : [],
      }) as Transaction,
  );
  return { transactions: txs, lastKey: res.LastEvaluatedKey };
}

// Note 12: Queries a full year of transactions to build monthly aggregates.
// The while loop handles the case where a year has more than 1,000 transactions,
// which exceeds DynamoDB's single-query limit, by following the pagination cursor.
export async function getUserMonthlyAggregates(userId: string, year?: number) {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const y = year || new Date().getFullYear();
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;
  const res = await getUserTransactionsPaged(userId, {
    startDate: start,
    endDate: end,
    limit: 1000,
  });
  // If more than 1000 results, paginate (simple loop)
  let all = res.transactions.slice();
  let last = res.lastKey;
  while (last) {
    const next = await getUserTransactionsPaged(userId, {
      startDate: start,
      endDate: end,
      limit: 1000,
      lastKey: last,
    });
    all = all.concat(next.transactions);
    last = next.lastKey;
  }
  const months: Record<string, number> = {};
  for (const t of all) {
    // Note 13: `slice(0, 7)` extracts the "YYYY-MM" portion of an ISO date string.
    const m = t.date ? t.date.slice(0, 7) : "unknown";
    months[m] = (months[m] || 0) + Number(t.amount || 0);
  }
  // return sorted array of { month: 'YYYY-MM', total }
  return Object.keys(months)
    .sort()
    .map((k) => ({ month: k, total: months[k] }));
}

// Note 14: `putTransaction` acts as an upsert. DynamoDB's `PutCommand` replaces
// the entire item if the primary key already exists, or creates a new item if it
// does not. This means the same function handles both create and update operations.
export async function putTransaction(userId: string, tx: Transaction) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const item = buildTransactionItem(userId, tx);

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

function buildTransactionItem(userId: string, tx: Transaction) {
  const now = new Date().toISOString();
  return {
    pk: `user#${userId}`,
    // Note 15: Encoding the date in the sort key ("date#YYYY-MM-DD#<id>") allows
    // date-range queries without a secondary index. The id at the end ensures
    // uniqueness when multiple transactions share the same date.
    sk: `${SK_PREFIX.TRANSACTION}${tx.date}#${tx.id}`,
    id: tx.id,
    name: tx.name,
    amount: tx.amount,
    category: tx.category,
    date: tx.date,
    notes: tx.notes || "",
    paymentMethod: tx.paymentMethod || "",
    tags: tx.tags || [],
    createdAt: tx.createdAt || now,
    updatedAt: now,
  } as const;
}

export async function updateTransaction(
  userId: string,
  tx: Transaction,
  originalDate?: string,
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");

  if (originalDate && originalDate !== tx.date) {
    await client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: `user#${userId}`,
          sk: `${SK_PREFIX.TRANSACTION}${originalDate}#${tx.id}`,
        },
      }),
    );
  }

  const item = buildTransactionItem(userId, tx);
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function deleteTransaction(
  userId: string,
  txId: string,
  date: string,
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  // Note 16: DynamoDB `DeleteCommand` requires the full primary key (pk + sk).
  // Both partition key and sort key must be provided -- the sort key cannot be
  // omitted even though we only want to delete by transaction id.
  const sk = `${SK_PREFIX.TRANSACTION}${date}#${txId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}

export async function putGoal(userId: string, goal: Goal) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  // Note 17: ID generation is delegated to the shared `generateId` utility.
  const id = goal.goalId || generateId();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.GOAL}${id}`,
    goalId: id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentSaved: goal.currentSaved ?? 0,
    monthlyContribution: goal.monthlyContribution ?? 0,
    expectedAnnualReturn: goal.expectedAnnualReturn ?? 0,
    createdAt: goal.createdAt || now,
    updatedAt: now,
  } as const;

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const pk = `user#${userId}`;
  // Note 18: `begins_with` is a DynamoDB key condition function that efficiently
  // scans only items whose sort key starts with the given prefix. Combined with
  // the partition key condition, this retrieves all goals for a user without
  // scanning items of other entity types (transactions, budgets, etc.).
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": SK_PREFIX.GOAL },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = res.Items ?? [];
  return items.map((item) => ({
    goalId: String(item.goalId || ""),
    name: String(item.name || ""),
    targetAmount: Number(item.targetAmount || 0),
    currentSaved: Number(item.currentSaved || 0),
    monthlyContribution: Number(item.monthlyContribution || 0),
    expectedAnnualReturn: Number(item.expectedAnnualReturn || 0),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteGoal(userId: string, goalId: string) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const sk = `${SK_PREFIX.GOAL}${goalId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}

export async function putBudget(
  userId: string,
  budget: {
    budgetId?: string;
    name: string;
    monthlyIncome?: number;
    expenses?: {
      expenseId?: string;
      name: string;
      amount: number;
      category: string;
      group?: string;
    }[];
    allocations?: { category: string; amount: number }[];
    createdAt?: string;
    updatedAt?: string;
  },
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id = budget.budgetId || generateId();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.BUDGET}${id}`,
    budgetId: id,
    name: budget.name,
    monthlyIncome: budget.monthlyIncome,
    expenses: budget.expenses || [],
    allocations: budget.allocations || [],
    createdAt: budget.createdAt || now,
    updatedAt: now,
  } as const;

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserBudgets(userId: string) {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": SK_PREFIX.BUDGET },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = res.Items ?? [];
  return items.map((item) => ({
    budgetId: String(item.budgetId || ""),
    name: String(item.name || ""),
    monthlyIncome:
      typeof item.monthlyIncome === "number" ? item.monthlyIncome : undefined,
    expenses: Array.isArray(item.expenses) ? item.expenses : [],
    allocations: Array.isArray(item.allocations) ? item.allocations : [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteBudget(userId: string, budgetId: string) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const sk = `${SK_PREFIX.BUDGET}${budgetId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}
