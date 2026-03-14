// Note 1: `GET /api/reports` returns only the authenticated user's transaction
// data. It filters and paginates in memory so tags, search, and aggregates are
// computed from the same isolated dataset the user is allowed to see.
import { NextRequest, NextResponse } from "next/server";
import { aggregateTransactions, filterTransactions } from "@/lib/aggregations";
import { getUserTransactions } from "@/lib/dynamo";
import { getRequestUserId } from "@/lib/requestUser";

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

    const userId = await getRequestUserId(request);
    const allTransactions = await getUserTransactions(userId);
    const filtered = filterTransactions(allTransactions, {
      startDate,
      endDate,
      tags,
      search,
    });

    const start = (page - 1) * pageSize;
    const transactions = filtered.slice(start, start + pageSize);
    const aggregates = includeAggregates
      ? aggregateTransactions(filtered)
      : undefined;

    return NextResponse.json({
      transactions,
      totalCount: filtered.length,
      aggregates,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[/api/reports]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load reports" } },
      { status: 500 },
    );
  }
}
