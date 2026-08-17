// Note: Data access helpers for the progress (retirement/milestones/goal) APIs.
import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { getDocClient } from "../api/dynamoClient";
import { generateId } from "./generateId";
import { SK_PREFIX } from "../api/tableKeys";
import type {
  MilestoneEntry,
  ProgressGoal,
  RetirementEntry,
} from "../types/types";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "";

interface RetirementQueryItem {
  entryId?: unknown;
  year?: unknown;
  startAmount?: unknown;
  endAmount?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface MilestoneQueryItem {
  milestoneId?: unknown;
  amount?: unknown;
  year?: unknown;
  month?: unknown;
  age?: unknown;
  note?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface ProgressGoalQueryItem {
  goalId?: unknown;
  targetAmount?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** A conditional write lost its optimistic-concurrency race. */
export class MilestoneConflictError extends Error {
  constructor() {
    super("Milestone was modified");
    this.name = "MilestoneConflictError";
  }
}

function isConditionalWriteFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? error.name : undefined;
  return (
    name === "ConditionalCheckFailedException" ||
    name === "TransactionCanceledException"
  );
}

export async function putRetirement(
  userId: string,
  entry: {
    entryId?: string;
    year: number;
    startAmount: number;
    endAmount: number;
  },
): Promise<RetirementEntry> {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id = entry.entryId || generateId();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.RETIREMENT}${entry.year}#${id}`,
    entryId: id,
    year: entry.year,
    startAmount: entry.startAmount,
    endAmount: entry.endAmount,
    createdAt: now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserRetirement(
  userId: string,
): Promise<RetirementEntry[]> {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": SK_PREFIX.RETIREMENT },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as RetirementQueryItem[];
  return items.map((item) => ({
    entryId: String(item.entryId || ""),
    year: Number(item.year || 0),
    startAmount: Number(item.startAmount || 0),
    endAmount: Number(item.endAmount || 0),
    createdAt: readOptionalString(item.createdAt),
    updatedAt: readOptionalString(item.updatedAt),
  }));
}

export async function deleteRetirement(
  userId: string,
  entryId: string,
  year: number,
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const sk = `${SK_PREFIX.RETIREMENT}${year}#${entryId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}

export async function putMilestone(
  userId: string,
  m: {
    milestoneId?: string;
    amount: number;
    year?: number | null;
    month?: number | null;
    age?: number | null;
    note?: string;
    createdAt?: string;
  },
): Promise<MilestoneEntry> {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id = m.milestoneId || generateId();
  const year = m.year ?? 0;
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.MILESTONE}${year}#${id}`,
    milestoneId: id,
    amount: m.amount,
    year: m.year ?? null,
    month: m.month ?? null,
    age: m.age ?? null,
    note: m.note || "",
    createdAt: m.createdAt ?? now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function updateMilestone(
  userId: string,
  milestone: {
    milestoneId: string;
    originalYear: number | null;
    amount: number;
    year?: number | null;
    month?: number | null;
    age?: number | null;
    note?: string;
    createdAt?: string;
    expectedUpdatedAt?: string;
  },
): Promise<MilestoneEntry> {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");

  const originalYear = milestone.originalYear ?? 0;
  const nextYear = milestone.year ?? 0;
  const sourceCondition = milestone.expectedUpdatedAt
    ? {
        ConditionExpression:
          "attribute_exists(pk) AND #updatedAt = :expectedUpdatedAt",
        ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
        ExpressionAttributeValues: {
          ":expectedUpdatedAt": milestone.expectedUpdatedAt,
        },
      }
    : {
        ConditionExpression:
          "attribute_exists(pk) AND attribute_not_exists(#updatedAt)",
        ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
      };
  const now = new Date().toISOString();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.MILESTONE}${nextYear}#${milestone.milestoneId}`,
    milestoneId: milestone.milestoneId,
    amount: milestone.amount,
    year: milestone.year ?? null,
    month: milestone.month ?? null,
    age: milestone.age ?? null,
    note: milestone.note || "",
    createdAt: milestone.createdAt ?? now,
    updatedAt: now,
  } as const;

  if (originalYear !== nextYear) {
    try {
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Delete: {
                TableName: TABLE_NAME,
                Key: {
                  pk: `user#${userId}`,
                  sk: `${SK_PREFIX.MILESTONE}${originalYear}#${milestone.milestoneId}`,
                },
                ...sourceCondition,
              },
            },
            {
              Put: {
                TableName: TABLE_NAME,
                Item: item,
                ConditionExpression:
                  "attribute_not_exists(pk) AND attribute_not_exists(sk)",
              },
            },
          ],
        }),
      );
    } catch (error) {
      if (isConditionalWriteFailure(error)) throw new MilestoneConflictError();
      throw error;
    }
    return item;
  }

  try {
    await client.send(
      new PutCommand({ TableName: TABLE_NAME, Item: item, ...sourceCondition }),
    );
  } catch (error) {
    if (isConditionalWriteFailure(error)) throw new MilestoneConflictError();
    throw error;
  }
  return item;
}

export async function getUserMilestones(
  userId: string,
): Promise<MilestoneEntry[]> {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": SK_PREFIX.MILESTONE },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as MilestoneQueryItem[];
  return items.map((item) => ({
    milestoneId: String(item.milestoneId || ""),
    amount: Number(item.amount || 0),
    year: typeof item.year === "number" ? item.year : null,
    month: typeof item.month === "number" ? item.month : null,
    age: typeof item.age === "number" ? item.age : null,
    note: String(item.note || ""),
    createdAt: readOptionalString(item.createdAt),
    updatedAt: readOptionalString(item.updatedAt),
  }));
}

export async function deleteMilestone(
  userId: string,
  milestoneId: string,
  year?: number,
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const y = year ?? 0;
  const sk = `${SK_PREFIX.MILESTONE}${y}#${milestoneId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}

export async function putProgressGoal(
  userId: string,
  g: { goalId?: string; targetAmount: number },
): Promise<ProgressGoal> {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id = g.goalId || generateId();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.PROGRESS_GOAL}${id}`,
    goalId: id,
    targetAmount: g.targetAmount,
    createdAt: now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserProgressGoals(
  userId: string,
): Promise<ProgressGoal[]> {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: {
      ":pk": pk,
      ":prefix": SK_PREFIX.PROGRESS_GOAL,
    },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as ProgressGoalQueryItem[];
  return items.map((item) => ({
    goalId: String(item.goalId || ""),
    targetAmount: Number(item.targetAmount || 0),
    createdAt: readOptionalString(item.createdAt),
    updatedAt: readOptionalString(item.updatedAt),
  }));
}
