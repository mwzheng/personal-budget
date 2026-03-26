// Note: Data access helpers for the progress (retirement/milestones/goal) APIs.
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from "../api/dynamoClient";
import { generateId } from "./generateId";
import { SK_PREFIX } from "../api/tableKeys";
import type { Goal, MilestoneEntry, RetirementEntry } from "../types/types";

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
  age?: unknown;
  note?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface ProgressGoalQueryItem {
  goalId?: unknown;
  name?: unknown;
  targetAmount?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function putRetirement(
  userId: string,
  entry: {
    entryId?: string;
    year: number;
    startAmount: number;
    endAmount: number;
  },
) {
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
    year?: number;
    age?: number;
    note?: string;
  },
) {
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
    age: m.age ?? null,
    note: m.note || "",
    createdAt: now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
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
    year: item.year ? Number(item.year) : null,
    age: item.age ? Number(item.age) : null,
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
  g: { goalId?: string; targetAmount: number; name?: string },
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id = g.goalId || generateId();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.PROGRESS_GOAL}${id}`,
    goalId: id,
    name: g.name || "Progress Goal",
    targetAmount: g.targetAmount,
    createdAt: now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserProgressGoals(userId: string): Promise<Goal[]> {
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
    name: String(item.name || ""),
    targetAmount: Number(item.targetAmount || 0),
    createdAt: readOptionalString(item.createdAt),
    updatedAt: readOptionalString(item.updatedAt),
  }));
}
