// Note: Simple user profile upsert/get helpers. Uses a dedicated users table
// when available (DYNAMODB_USERS_TABLE or USERS_TABLE) and falls back to the
// main DYNAMODB_TABLE if necessary.
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from "../api/dynamoClient";

const USERS_TABLE =
  process.env.DYNAMODB_USERS_TABLE ||
  process.env.USERS_TABLE ||
  process.env.DYNAMODB_TABLE ||
  "";

interface UserProfileRecord {
  pk: string;
  sk: string;
  userId: string;
  email: string | null;
  name: string | null;
  given_name: string | null;
  family_name: string | null;
  updatedAt: string;
  createdAt: string;
}

function readStringClaim(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function upsertUserProfile(
  payload: Record<string, unknown>,
): Promise<UserProfileRecord | null> {
  const client = getDocClient(USERS_TABLE);
  if (!client) return null;
  const sub =
    readStringClaim(payload, "sub") ??
    readStringClaim(payload, "cognito:username") ??
    readStringClaim(payload, "username");
  if (!sub) return null;
  const now = new Date().toISOString();
  const item: UserProfileRecord = {
    pk: `user#${sub}`,
    sk: `profile#${sub}`,
    userId: sub,
    email: readStringClaim(payload, "email") ?? null,
    name:
      readStringClaim(payload, "name") ??
      readStringClaim(payload, "given_name") ??
      null,
    given_name: readStringClaim(payload, "given_name") ?? null,
    family_name: readStringClaim(payload, "family_name") ?? null,
    updatedAt: now,
    createdAt: readStringClaim(payload, "createdAt") ?? now,
  };
  await client.send(new PutCommand({ TableName: USERS_TABLE, Item: item }));
  return item;
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfileRecord | null> {
  const client = getDocClient(USERS_TABLE);
  if (!client) return null;
  const res = await client.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { pk: `user#${userId}`, sk: `profile#${userId}` },
    }),
  );
  return (res.Item as UserProfileRecord | undefined) ?? null;
}
