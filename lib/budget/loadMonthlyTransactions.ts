import { apiFetch } from "@/lib/api/apiFetch";
import type { Transaction } from "@/lib/types/types";
import { monthBounds } from "./comparison";

export async function loadMonthlyTransactions(
  month: string,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const bounds = monthBounds(month);
  const transactions = new Map<string, Transaction>();
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  do {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const query = new URLSearchParams({ ...bounds, limit: "200" });
    if (cursor) query.set("cursor", cursor);
    const response = await apiFetch(`/api/transactions?${query}`, { signal });
    if (!response.ok)
      throw new Error("Could not load this month’s transactions.");
    const body = await response.json();
    if (!body.ok || !Array.isArray(body.transactions))
      throw new Error("The transaction response was incomplete.");
    for (const transaction of body.transactions as Transaction[]) {
      if (
        typeof transaction.id !== "string" ||
        typeof transaction.date !== "string" ||
        !Number.isFinite(transaction.amount)
      ) {
        throw new Error("The transaction response was incomplete.");
      }
      if (
        transaction.date >= bounds.startDate &&
        transaction.date <= bounds.endDate
      )
        transactions.set(transaction.id, transaction);
    }
    cursor =
      typeof body.nextCursor === "string" && body.nextCursor
        ? body.nextCursor
        : undefined;
    if (body.hasMore && !cursor)
      throw new Error("The transaction response was incomplete.");
    if (cursor) {
      if (seenCursors.has(cursor))
        throw new Error("The transaction response was incomplete.");
      seenCursors.add(cursor);
    }
  } while (cursor);
  return [...transactions.values()];
}
