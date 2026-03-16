// Note: Simple user profile upsert/get helpers. Uses a dedicated users table
// when available (DYNAMODB_USERS_TABLE or USERS_TABLE) and falls back to the
// main DYNAMODB_TABLE if necessary.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const USERS_TABLE =
  process.env.DYNAMODB_USERS_TABLE ||
  process.env.USERS_TABLE ||
  process.env.DYNAMODB_TABLE ||
  "";
let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient | null {
  if (docClient) return docClient;
  if (!USERS_TABLE) return null;
  const client = new DynamoDBClient({});
  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
}

export async function upsertUserProfile(payload: Record<string, any>) {
  const client = getDocClient();
  if (!client) return null;
  const sub = payload.sub || payload["cognito:username"] || payload.username;
  if (!sub) return null;
  const now = new Date().toISOString();
  const item = {
    pk: `user#${sub}`,
    sk: `profile#${sub}`,
    userId: sub,
    email: payload.email || null,
    name: payload.name || payload.given_name || null,
    given_name: payload.given_name || null,
    family_name: payload.family_name || null,
    updatedAt: now,
    createdAt: payload.createdAt || now,
  } as const;
  await client.send(new PutCommand({ TableName: USERS_TABLE, Item: item }));
  return item;
}

export async function getUserProfile(userId: string) {
  const client = getDocClient();
  if (!client) return null;
  const res = await client.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { pk: `user#${userId}`, sk: `profile#${userId}` },
    }),
  );
  return (res as any).Item || null;
}
