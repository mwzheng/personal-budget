// Note 1: `lib/salary.ts` provides the DynamoDB data access layer for salary entries.
// It mirrors the patterns used in `lib/dynamo.ts` but is scoped specifically
// to salary data, keeping each entity's access code easy to read and extend.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "";
// Note 2: The `docClient` is initialized lazily (only on first use) and cached
// in the module-level variable so subsequent calls reuse the same SDK client
// instance. Creating new SDK clients for every request adds unnecessary latency
// and may exhaust connection pools at high request rates.
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
  // Note 3: `crypto.randomUUID()` is the Web Crypto API available in Node 19+
  // and modern browsers. The `Date.now().toString()` fallback handles older
  // environments. The resulting `id` is used as the unique identifier for this entry.
  const id =
    entry.entryId ||
    (typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Date.now().toString());
  // Note 4: The DynamoDB sort key encodes `salary#<year>#<id>`. Including the
  // year in the sort key means salary entries can be range-queried by year
  // using `begins_with(sk, "salary#2024")` without needing a secondary index.
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
    ExpressionAttributeValues: { ":pk": pk, ":prefix": "salary#" },
  } as const;

  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as any[];
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
  const client = getDocClient();
  if (!client) throw new Error("DynamoDB table not configured");
  // Note 8: The full sort key must be reconstructed for the DeleteCommand. DynamoDB
  // requires both the partition key (`pk`) and sort key (`sk`) to identify a
  // unique item. The year is embedded in the `sk` to match how `putSalary` wrote it.
  const sk = `salary#${year}#${entryId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}
