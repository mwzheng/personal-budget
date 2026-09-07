// Note 1: `GET /api/reports/export` builds a CSV from the current user's
// filtered transactions on the server. That keeps export authorization aligned
// with the same Cognito-scoped data rules as the rest of the reports API.
import { NextRequest } from "next/server";
import { filterTransactions } from "@/lib/utils/aggregations";
import { transactionsToCsv } from "@/lib/utils/csvExport";
import { getUserTransactionsPaged } from "@/lib/api/dynamo";
import { getRequestUserId } from "@/lib/auth/requestUser";
import { parseTransactionCategoryFilters } from "@/lib/utils/transaction-categories";
import {
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

    const userId = await getRequestUserId(request);
    const range = resolveReportRange(searchParams);
    // CSV export is intentionally the non-paginated exception: it follows the
    // cursor to export the complete, explicitly date-bounded report range.
    let lastKey: Record<string, unknown> | undefined;
    const allTransactions = [];
    do {
      const result = await getUserTransactionsPaged(userId, {
        ...range,
        limit: 200,
        lastKey: lastKey as never,
      });
      allTransactions.push(...result.transactions);
      lastKey = result.lastKey as Record<string, unknown> | undefined;
    } while (lastKey);
    const filtered = filterTransactions(allTransactions, {
      years,
      startDate,
      endDate,
      categories,
      tags,
      search,
      minAmount,
      maxAmount,
    });
    const csv = transactionsToCsv(filtered);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions_export.csv"',
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof InvalidReportDateRangeError) {
      return Response.json(
        { error: { code: "INVALID_DATE_RANGE", message: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof InvalidReportAmountRangeError) {
      return Response.json(
        { error: { code: "INVALID_AMOUNT_RANGE", message: error.message } },
        { status: 400 },
      );
    }
    console.error("[/api/reports/export]", error);
    return new Response("Failed to export CSV", { status: 500 });
  }
}
