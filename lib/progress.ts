// Note: Data access helpers for the progress (retirement/milestones/goal) APIs.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "";
let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient | null {
  if (docClient) return docClient;
  if (!TABLE_NAME) return null;
  const client = new DynamoDBClient({});
  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
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
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id =
    entry.entryId ||
    (typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Date.now().toString());
  const item = {
    pk: `user#${userId}`,
    sk: `retirement#${entry.year}#${id}`,
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

export async function getUserRetirement(userId: string) {
  const client = getDocClient();
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "retirement#" },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    entryId: String(item.entryId || ""),
    year: Number(item.year || 0),
    startAmount: Number(item.startAmount || 0),
    endAmount: Number(item.endAmount || 0),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteRetirement(
  userId: string,
  entryId: string,
  year: number,
) {
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  const sk = `retirement#${year}#${entryId}`;
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
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id =
    m.milestoneId ||
    (typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Date.now().toString());
  const year = m.year ?? 0;
  const item = {
    pk: `user#${userId}`,
    sk: `milestone#${year}#${id}`,
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

export async function getUserMilestones(userId: string) {
  const client = getDocClient();
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "milestone#" },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    milestoneId: String(item.milestoneId || ""),
    amount: Number(item.amount || 0),
    year: item.year ? Number(item.year) : null,
    age: item.age ? Number(item.age) : null,
    note: String(item.note || ""),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteMilestone(
  userId: string,
  milestoneId: string,
  year?: number,
) {
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  const y = year ?? 0;
  const sk = `milestone#${y}#${milestoneId}`;
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
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id =
    g.goalId ||
    (typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Date.now().toString());
  const item = {
    pk: `user#${userId}`,
    sk: `progressGoal#${id}`,
    goalId: id,
    name: g.name || "Progress Goal",
    targetAmount: g.targetAmount,
    createdAt: now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserProgressGoals(userId: string) {
  const client = getDocClient();
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "progressGoal#" },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    goalId: String(item.goalId || ""),
    name: String(item.name || ""),
    targetAmount: Number(item.targetAmount || 0),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}
