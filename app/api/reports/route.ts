// Note 1: `GET /api/reports` is the main data endpoint for the reports page.
// It supports filtering (date range, tags, search), pagination, and optionally
// returns pre-computed aggregates in the same request to avoid a second round trip.
import { NextRequest, NextResponse } from "next/server";
import { filterTransactions, aggregateTransactions } from "@/lib/aggregations";
import { requireAuth } from "@/lib/cognitoAuth";
import { getUserTransactions } from "@/lib/dynamo";

export async function GET(request: NextRequest) {
  try {
    const cognitoUserPoolId =
      process.env.COGNITO_USER_POOL_ID ||
      process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ||
      "";
    const cognitoClientId =
      process.env.COGNITO_CLIENT_ID ||
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
      "";
    const { searchParams } = new URL(request.url);

    // Note 2: `?? undefined` converts null (returned by `searchParams.get` when the
    // param is missing) to undefined. The filter functions treat undefined as "no
    // filter applied", while null is treated as "filter is set to null explicitly".
    const startDateRaw = searchParams.get("startDate");
    const endDateRaw = searchParams.get("endDate");
    // Note 3: `searchParams.get` returns `string | null`. The aggregations layer
    // expects `null` to represent a missing filter, so preserve `null` rather
    // than converting it to `undefined` which would narrow the type incompatibly.
    const startDate = startDateRaw;
    const endDate = endDateRaw;
    const tagsParam = searchParams.get("tags");
    // Note 3: Tags are sent as a comma-separated string ("groceries,dining") and
    // split here. `filter(Boolean)` removes any empty strings that result from
    // trailing commas (e.g. "groceries,").
    const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
    const search = searchParams.get("search") ?? "";
    // Note 4: `Math.max(1, ...)` clamps the page number to a minimum of 1 to
    // prevent negative or zero page numbers from producing unexpected results.
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    // Note 5: `Math.min(2000, ...)` caps the page size to prevent a client from
    // requesting an unbounded number of records in one call, which could exhaust
    // memory or time out. 2000 is a reasonable upper limit for browser rendering.
    const pageSize = Math.min(
      2000,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "1000", 10)),
    );
    const includeAggregates = searchParams.get("includeAggregates") !== "false";

    // Note 6: `DISABLE_AUTH` allows running the app in local development without
    // setting up Cognito. When auth is skipped, a fixed `local-demo` userId is
    // used so all sample data is consistently associated with the same "user".
    const skipAuth = process.env.DISABLE_AUTH === "true" || !cognitoUserPoolId;
    let userId = "local-demo";
    if (!skipAuth) {
      userId = await requireAuth(request, {
        region: process.env.AWS_REGION,
        userPoolId: cognitoUserPoolId,
        audience: cognitoClientId || undefined,
      });
    }

    // Use paged DynamoDB query when available
    let transactions = [] as any[];
    let totalCount = 0;
    let lastKey = undefined as any | undefined;

    try {
      const dynamo = await import("@/lib/dynamo");
      if (dynamo.getUserTransactionsPaged) {
        // Note 7: DynamoDB uses cursor-based pagination, not offset-based. To
        // simulate page-based navigation the loop iterates through earlier pages
        // to reach the requested page. For large offsets this is not efficient;
        // prefer passing `lastKey` directly for production-scale pagination.
        // Translate page/pageSize into limit/lastKey flow. For simple UX, support page+pageSize by iterating pages (not ideal for high offsets).
        const limit = pageSize;
        // If client provides lastKey param, use it. Otherwise, use page-based iteration up to page
        const lastKeyParam = searchParams.get("lastKey");
        if (lastKeyParam) {
          const parsed = JSON.parse(lastKeyParam);
          const res = await dynamo.getUserTransactionsPaged(userId, {
            limit,
            lastKey: parsed,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
          });
          transactions = res.transactions;
          lastKey = res.lastKey;
        } else {
          // iterate pages until the requested page
          let currentLast = undefined;
          for (let p = 1; p <= page; p++) {
            const res = await dynamo.getUserTransactionsPaged(userId, {
              limit,
              lastKey: currentLast,
              startDate: startDate ?? undefined,
              endDate: endDate ?? undefined,
            });
            if (p === page) {
              transactions = res.transactions;
              lastKey = res.lastKey;
            }
            currentLast = res.lastKey;
            if (!currentLast) break;
          }
        }
        // For now we can't cheaply compute totalCount without a separate aggregate; leave as -1 to indicate unknown
        totalCount = -1;
      } else {
        const allTransactions = await dynamo.getUserTransactions(userId);
        const filtered = filterTransactions(allTransactions, {
          startDate,
          endDate,
          tags,
          search,
        });
        totalCount = filtered.length;
        const start = (page - 1) * pageSize;
        transactions = filtered.slice(start, start + pageSize);
      }
    } catch {
      // Note 8: The try/catch here handles the case where DynamoDB is unavailable
      // (e.g. no AWS credentials in the environment). The fallback reads transactions
      // from `getUserTransactions`, which falls back to the local CSV sample file.
      // fallback to in-memory filtering
      const allTransactions = await getUserTransactions(userId);
      const filtered = filterTransactions(allTransactions, {
        startDate,
        endDate,
        tags,
        search,
      });
      totalCount = filtered.length;
      const start = (page - 1) * pageSize;
      transactions = filtered.slice(start, start + pageSize);
    }

    // Note 9: Aggregates are computed only when the client requests them
    // (`includeAggregates !== false`). This avoids CPU work on requests that only
    // need raw transaction data (e.g. export, table display without summary).
    const aggregates = includeAggregates
      ? aggregateTransactions(transactions)
      : undefined;

    return NextResponse.json({ transactions, totalCount, aggregates, lastKey });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[/api/reports]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load reports" } },
      { status: 500 },
    );
  }
}
