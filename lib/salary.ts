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

export async function putSalary(
  userId: string,
  entry: { entryId?: string; year: number; amount: number; note?: string },
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
    sk: `salary#${entry.year}#${id}`,
    entryId: id,
    year: entry.year,
    amount: entry.amount,
    note: entry.note || "",
    createdAt: now,
    updatedAt: now,
  } as const;

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserSalary(userId: string) {
  const client = getDocClient();
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "salary#" },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    entryId: String(item.entryId || ""),
    year: Number(item.year || 0),
    amount: Number(item.amount || 0),
    note: String(item.note || ""),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteSalary(
  userId: string,
  entryId: string,
  year: number,
) {
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  const sk = `salary#${year}#${entryId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}
