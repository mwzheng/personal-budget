// Note 1: `GET /api/reports/export` builds a CSV from the current user's
// filtered transactions on the server. That keeps export authorization aligned
// with the same Cognito-scoped data rules as the rest of the reports API.
import { NextRequest } from "next/server";
import { filterTransactions } from "@/lib/aggregations";
import { transactionsToCsv } from "@/lib/csvExport";
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

    const userId = await getRequestUserId(request);
    const allTransactions = await getUserTransactions(userId);
    const filtered = filterTransactions(allTransactions, {
      startDate,
      endDate,
      tags,
      search,
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
    console.error("[/api/reports/export]", error);
    return new Response("Failed to export CSV", { status: 500 });
  }
}
