// Note 1: `lib/salary.ts` provides the DynamoDB data access layer for salary entries.
// It mirrors the patterns used in `lib/dynamo.ts` but is scoped specifically
// to salary data, keeping each entity's access code easy to read and extend.
// Note 2: Client initialization is handled by the shared `dynamoClient` module.
// See `lib/api/dynamoClient.ts` for caching and lazy-init details.
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from "../api/dynamoClient";
import { generateId } from "./generateId";
import { SK_PREFIX } from "../api/tableKeys";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "";

export async function putSalary(
  userId: string,
  entry: { entryId?: string; year: number; amount: number; note?: string },
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  // Note 3: ID generation is handled by the shared `generateId` utility, which
  // uses `crypto.randomUUID()` when available and falls back to a timestamp-based
  // approach in older environments.
  const id = entry.entryId || generateId();
  // Note 4: The DynamoDB sort key encodes `salary#<year>#<id>`. Including the
  // year in the sort key means salary entries can be range-queried by year
  // using `begins_with(sk, "salary#2024")` without needing a secondary index.
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.SALARY}${entry.year}#${id}`,
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
  const client = getDocClient(TABLE_NAME);
  // Note 5: Returning an empty array (instead of throwing) when DynamoDB is
  // unconfigured allows the route to work in local/demo mode without crashing.
  if (!client) return [];
  const pk = `user#${userId}`;
  // Note 6: `begins_with(#sk, :prefix)` fetches all items whose sort key starts
  // with "salary#". This is a native DynamoDB KeyConditionExpression function
  // and runs directly on the primary index, avoiding an expensive table scan.
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": pk, ":prefix": SK_PREFIX.SALARY },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = res.Items ?? [];
  // Note 7: Explicitly coercing each field with `String(...)` and `Number(...)`
  // protects against DynamoDB returning numeric fields as the `N` attribute
  // type (a string representation) when the Document Client is bypassed or
  // when items were written by a different code path.
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
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  // Note 8: The full sort key must be reconstructed for the DeleteCommand. DynamoDB
  // requires both the partition key (`pk`) and sort key (`sk`) to identify a
  // unique item. The year is embedded in the `sk` to match how `putSalary` wrote it.
  const sk = `${SK_PREFIX.SALARY}${year}#${entryId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}
