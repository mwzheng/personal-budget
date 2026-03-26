/**
 * Note 1: Shared DynamoDB document client factory with per-table lazy initialization.
 *
 * Before this module existed, four files (dynamo.ts, users.ts, progress.ts,
 * salary.ts) each maintained their own module-level singleton and identical
 * lazy-init function. This shared factory deduplicates that pattern while
 * preserving the same semantics:
 *   - Lazy: a client is only created on first use for a given table name.
 *   - Cached: subsequent calls for the same table return the same instance,
 *     avoiding extra HTTP connection pools (important for Lambda cold starts).
 *   - Null-safe: returns null when the table name is falsy, letting callers
 *     fall back to local/demo data.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Note 2: A Map keyed by table name caches one DynamoDBDocumentClient per
// distinct table. This preserves the singleton-per-module behavior the old
// code relied on while allowing multiple tables (e.g., DYNAMODB_TABLE vs
// DYNAMODB_USERS_TABLE) to each have their own connection pool.
const clientCache = new Map<string, DynamoDBDocumentClient>();

/**
 * Returns a cached {@link DynamoDBDocumentClient} for the given table name,
 * or `null` when the table name is falsy (table not configured).
 *
 * @param tableName - The DynamoDB table name, typically read from an env var.
 * @returns A reusable document client, or `null` if `tableName` is empty.
 */
export function getDocClient(tableName: string): DynamoDBDocumentClient | null {
  if (!tableName) return null;

  const existing = clientCache.get(tableName);
  if (existing) return existing;

  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);
  clientCache.set(tableName, docClient);
  return docClient;
}
