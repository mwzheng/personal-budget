// Note 1: `GET /api/reports` returns only the authenticated user's transaction
// data. It filters and paginates in memory so tags, search, and aggregates are
// computed from the same isolated dataset the user is allowed to see.
import { NextRequest, NextResponse } from "next/server";
import {
  aggregateTransactions,
  filterTransactions,
} from "@/lib/utils/aggregations";
import { getUserTransactionsPaged } from "@/lib/api/dynamo";
import { getRequestUserId } from "@/lib/auth/requestUser";
import { parseTransactionCategoryFilters } from "@/lib/utils/transaction-categories";
import {
  decodeCursor,
  encodeCursor,
  InvalidCursorError,
  InvalidReportDateRangeError,
  resolveReportRange,
} from "@/lib/api/reportRange";
import {
  InvalidReportAmountRangeError,
  parseReportAmountRange,
} from "@/lib/utils/reportAmount";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearsParam = searchParams.get("years");
    const years = yearsParam ? yearsParam.split(",").filter(Boolean) : [];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categories = parseTransactionCategoryFilters(
      searchParams.get("categories"),
    );
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
    const search = searchParams.get("search") ?? "";
    const { minAmount, maxAmount } = parseReportAmountRange(searchParams);
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "100", 10)),
    );
    const page = Number(searchParams.get("page") ?? "1");
    const cursor = searchParams.get("cursor");
    if (Number.isInteger(page) && page > 1 && !cursor) {
      return NextResponse.json(
        {
          error: {
            code: "CURSOR_REQUIRED",
            message:
              "Cursor pagination requires nextCursor from the previous response; page numbers above 1 are no longer supported.",
          },
        },
        { status: 400 },
      );
    }
    const includeAggregates = searchParams.get("includeAggregates") !== "false";

    const range = resolveReportRange(searchParams);
    const userId = await getRequestUserId(request);
    const result = await getUserTransactionsPaged(userId, {
      startDate: range.startDate,
      endDate: range.endDate,
      limit: pageSize,
      lastKey: decodeCursor(cursor, userId),
    });
    const filtered = filterTransactions(result.transactions, {
      years,
      startDate,
      endDate,
      categories,
      tags,
      search,
      minAmount,
      maxAmount,
    });

    const transactions = filtered;
    const aggregates = includeAggregates
      ? aggregateTransactions(filtered)
      : undefined;

    // `totalCount` and `aggregates` intentionally describe this cursor page
    // after its in-memory filters. Computing filtered totals across the whole
    // range would require an unbounded read and cannot be done from this query.
    return NextResponse.json({
      transactions,
      totalCount: filtered.length,
      aggregates,
      range,
      hasMore: Boolean(result.lastKey),
      nextCursor: encodeCursor(
        result.lastKey as Record<string, unknown> | undefined,
      ),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof InvalidCursorError) {
      return NextResponse.json(
        { error: { code: "INVALID_CURSOR", message: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof InvalidReportDateRangeError) {
      return NextResponse.json(
        { error: { code: "INVALID_DATE_RANGE", message: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof InvalidReportAmountRangeError) {
      return NextResponse.json(
        { error: { code: "INVALID_AMOUNT_RANGE", message: error.message } },
        { status: 400 },
      );
    }
    console.error("[/api/reports]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load reports" } },
      { status: 500 },
    );
  }
}
