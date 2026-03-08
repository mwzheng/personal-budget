import { NextRequest, NextResponse } from "next/server";
import { filterTransactions, aggregateTransactions } from "@/lib/aggregations";
import { requireAuth } from "@/lib/cognitoAuth";
import { getUserTransactions } from "@/lib/dynamo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      2000,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "1000", 10)),
    );
    const includeAggregates = searchParams.get("includeAggregates") !== "false";

    const skipAuth =
      process.env.DISABLE_AUTH === "true" || !process.env.COGNITO_USER_POOL_ID;
    let userId = "local-demo";
    if (!skipAuth) {
      userId = await requireAuth(request, {
        region: process.env.AWS_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID!,
        audience: process.env.COGNITO_CLIENT_ID,
      });
    }

    // Use paged DynamoDB query when available
    let transactions = [] as any[];
    let totalCount = 0;
    let lastKey = undefined as any | undefined;

    try {
      const dynamo = await import("@/lib/dynamo");
      if (dynamo.getUserTransactionsPaged) {
        // Translate page/pageSize into limit/lastKey flow. For simple UX, support page+pageSize by iterating pages (not ideal for high offsets).
        const limit = pageSize;
        // If client provides lastKey param, use it. Otherwise, use page-based iteration up to page
        const lastKeyParam = searchParams.get("lastKey");
        if (lastKeyParam) {
          const parsed = JSON.parse(lastKeyParam);
          const res = await dynamo.getUserTransactionsPaged(userId, {
            limit,
            lastKey: parsed,
            startDate,
            endDate,
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
              startDate,
              endDate,
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
    } catch (e) {
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

    const aggregates = includeAggregates
      ? aggregateTransactions(transactions)
      : undefined;

    return NextResponse.json({ transactions, totalCount, aggregates, lastKey });
  } catch (error) {
    console.error("[/api/reports]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load reports" } },
      { status: 500 },
    );
  }
}
