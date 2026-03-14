// Note 1: These tests protect the transaction-query builder from regressing back
// to a "read the whole user partition" query, which would leak salary/progress
// entities into reports and transaction tables in the single-table schema.
import { describe, expect, it } from "vitest";

import { buildTransactionsQuery } from "../lib/dynamo";

describe("buildTransactionsQuery", () => {
  it("restricts non-ranged queries to transaction sort keys", () => {
    const query = buildTransactionsQuery("user-123");

    expect(query.KeyConditionExpression).toBe(
      "#pk = :pk and begins_with(#sk, :prefix)",
    );
    expect(query.ExpressionAttributeValues).toMatchObject({
      ":pk": "user#user-123",
      ":prefix": "date#",
    });
  });

  it("uses a date-key range when explicit bounds are provided", () => {
    const query = buildTransactionsQuery("user-123", {
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });

    expect(query.KeyConditionExpression).toBe(
      "#pk = :pk and #sk BETWEEN :skStart and :skEnd",
    );
    expect(query.ExpressionAttributeValues).toMatchObject({
      ":pk": "user#user-123",
      ":skStart": "date#2025-01-01#",
      ":skEnd": "date#2025-12-31#\uffff",
    });
  });
});
