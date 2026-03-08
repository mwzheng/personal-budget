import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";
import { loadTransactionsFromCSV } from "./csvParser";
import type { Transaction } from "./types";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "";

let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient | null {
  if (docClient) return docClient;
  if (!TABLE_NAME) return null;
  const client = new DynamoDBClient({});
  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
}

export async function getUserTransactions(
  userId: string,
): Promise<Transaction[]> {
  const client = getDocClient();
  if (!client) {
    // Fallback to local sample CSV when DynamoDB table not configured
    const csvPath = join(process.cwd(), "sample-data", "expenses.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    return loadTransactionsFromCSV(csvContent);
  }

  const pk = `user#${userId}`;

  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: { "#pk": "pk" },
    ExpressionAttributeValues: { ":pk": pk },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as Record<string, unknown>[];

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

export async function putTransaction(userId: string, tx: Transaction) {
  const client = getDocClient();
  if (!client) throw new Error('DynamoDB table not configured');

  const now = new Date().toISOString();
  const item = {
    pk: `user#${userId}`,
    sk: `date#${tx.date}#${tx.id}`,
    id: tx.id,
    name: tx.name,
    amount: tx.amount,
    category: tx.category,
    date: tx.date,
    notes: tx.notes || '',
    paymentMethod: tx.paymentMethod || '',
    tags: tx.tags || [],
    createdAt: (tx as any).createdAt || now,
    updatedAt: now,
  } as const;

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function deleteTransaction(userId: string, txId: string, date: string) {
  const client = getDocClient();
  if (!client) throw new Error('DynamoDB table not configured');
  const sk = `date#${date}#${txId}`;
  await client.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `user#${userId}`, sk } }));
  return { ok: true };
}

export async function putGoal(userId: string, goal: { goalId?: string; name: string; targetAmount: number; currentSaved?: number; monthlyContribution?: number; expectedAnnualReturn?: number; createdAt?: string; updatedAt?: string }) {
  const client = getDocClient();
  if (!client) throw new Error('DynamoDB table not configured');
  const now = new Date().toISOString();
  const id = goal.goalId || (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Date.now().toString());
  const item = {
    pk: `user#${userId}`,
    sk: `goal#${id}`,
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

export async function getUserGoals(userId: string) {
  const client = getDocClient();
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "goal#" },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    goalId: String(item.goalId || ''),
    name: String(item.name || ''),
    targetAmount: Number(item.targetAmount || 0),
    currentSaved: Number(item.currentSaved || 0),
    monthlyContribution: Number(item.monthlyContribution || 0),
    expectedAnnualReturn: Number(item.expectedAnnualReturn || 0),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteGoal(userId: string, goalId: string) {
  const client = getDocClient();
  if (!client) throw new Error('DynamoDB table not configured');
  const sk = `goal#${goalId}`;
  await client.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `user#${userId}`, sk } }));
  return { ok: true };
}

export async function putBudget(userId: string, budget: { budgetId?: string; name: string; allocations: { category: string; amount: number }[]; createdAt?: string; updatedAt?: string }) {
  const client = getDocClient();
  if (!client) throw new Error('DynamoDB table not configured');
  const now = new Date().toISOString();
  const id = budget.budgetId || (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Date.now().toString());
  const item = {
    pk: `user#${userId}`,
    sk: `budget#${id}`,
    budgetId: id,
    name: budget.name,
    allocations: budget.allocations || [],
    createdAt: budget.createdAt || now,
    updatedAt: now,
  } as const;

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserBudgets(userId: string) {
  const client = getDocClient();
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "budget#" },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    budgetId: String(item.budgetId || ''),
    name: String(item.name || ''),
    allocations: Array.isArray(item.allocations) ? item.allocations : [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

