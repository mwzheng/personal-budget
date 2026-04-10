// Note 1: `GET /api/reports` returns only the authenticated user's transaction
// data. It filters and paginates in memory so tags, search, and aggregates are
// computed from the same isolated dataset the user is allowed to see.
import { NextRequest, NextResponse } from "next/server";
import {
  aggregateTransactions,
  filterTransactions,
} from "@/lib/utils/aggregations";
import { getUserTransactions } from "@/lib/api/dynamo";
import { getRequestUserId } from "@/lib/auth/requestUser";
import type { CategoryType } from "@/lib/types/types";

function parseCategoryFilters(raw: string | null): CategoryType[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .map((value): CategoryType | null => {
      if (value === "need") return "Need";
      if (value === "want") return "Want";
      if (value === "saving") return "Saving";
      return null;
    })
    .filter((value): value is CategoryType => value !== null);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearsParam = searchParams.get("years");
    const years = yearsParam ? yearsParam.split(",").filter(Boolean) : [];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categories = parseCategoryFilters(searchParams.get("categories"));
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
      years,
      startDate,
      endDate,
      categories,
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
