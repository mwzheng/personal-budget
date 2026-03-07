import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
