/**
 * Note 1: Transaction-domain handlers for the demo API. Covers the main CRUD
 * routes (`/api/transactions`) plus CSV import (`/api/reports/import`) and
 * export (`/api/reports/export`). Helper functions like `sortTransactions` and
 * `appendImportedTransactions` live here because they are transaction-specific.
 */

import { filterTransactions } from "../../utils/aggregations";
import { loadTransactionsFromCSV } from "../../utils/csvParser";
import { transactionsToCsv } from "../../utils/csvExport";
import { parseTransactionCategoryFilters } from "../../utils/transaction-categories";
import { createDemoId, getDemoStore, updateDemoStore } from "../demoData";
import type { Transaction } from "../../types/types";
import {
  type HandlerContext,
  jsonResponse,
  readBodyText,
  readJsonBody,
} from "./handlerUtils";

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    if (left.date === right.date) {
      return left.name.localeCompare(right.name);
    }

    return right.date.localeCompare(left.date);
  });
}

// Note 2: Deduplication uses a composite key of date + lowercased name + amount
// so re-importing the same CSV twice does not create duplicates.
function appendImportedTransactions(
  current: Transaction[],
  incoming: Transaction[],
): {
  nextTransactions: Transaction[];
  imported: Transaction[];
  skipped: Array<{ tx: Transaction; error: string }>;
} {
  const existingKeys = new Set(
    current.map(
      (transaction) =>
        `${transaction.date}|${transaction.name.toLowerCase()}|${transaction.amount}`,
    ),
  );

  const imported: Transaction[] = [];
  const skipped: Array<{ tx: Transaction; error: string }> = [];

  for (const transaction of incoming) {
    const duplicateKey = `${transaction.date}|${transaction.name.toLowerCase()}|${transaction.amount}`;

    if (existingKeys.has(duplicateKey)) {
      skipped.push({ tx: transaction, error: "Duplicate transaction" });
      continue;
    }

    existingKeys.add(duplicateKey);
    imported.push({
      ...transaction,
      id: createDemoId("demo-tx"),
    });
  }

  return {
    nextTransactions: sortTransactions([...current, ...imported]),
    imported,
    skipped,
  };
}

export async function handleTransactionRoutes(
  ctx: HandlerContext,
): Promise<Response | null> {
  const { url, method, input, init } = ctx;
  const pathname = url.pathname;

  if (pathname === "/api/transactions") {
    if (method === "GET") {
      return jsonResponse({
        ok: true,
        transactions: sortTransactions(getDemoStore().transactions),
      });
    }

    if (method === "POST") {
      const body = (await readJsonBody<Transaction>(input, init)) ?? null;
      if (!body) {
        return jsonResponse(
          { ok: false, error: "Missing transaction payload" },
          { status: 400 },
        );
      }

      const created: Transaction = {
        ...body,
        id: body.id || createDemoId("demo-tx"),
      };

      updateDemoStore((current) => ({
        ...current,
        transactions: sortTransactions([...current.transactions, created]),
      }));

      return jsonResponse({ ok: true, created });
    }

    if (method === "PUT") {
      const body = (await readJsonBody<Transaction>(input, init)) ?? null;
      if (!body?.id) {
        return jsonResponse(
          { ok: false, error: "Missing id for update" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        transactions: sortTransactions(
          current.transactions.map((transaction) =>
            transaction.id === body.id ? body : transaction,
          ),
        ),
      }));

      return jsonResponse({ ok: true, updated: body });
    }

    if (method === "DELETE") {
      const body =
        (await readJsonBody<{ id?: string }>(input, init)) ??
        ({} as { id?: string });
      const id = body.id ?? url.searchParams.get("id") ?? undefined;

      if (!id) {
        return jsonResponse(
          { ok: false, error: "Missing id" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        transactions: current.transactions.filter(
          (transaction) => transaction.id !== id,
        ),
      }));

      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/reports/import" && method === "POST") {
    const body =
      (await readJsonBody<{ csv?: string }>(input, init)) ??
      ({} as { csv?: string });
    const csvText = body.csv ?? (await readBodyText(input, init));

    if (!csvText.trim()) {
      return jsonResponse(
        {
          error: { code: "INVALID_INPUT", message: "No CSV payload provided" },
        },
        { status: 400 },
      );
    }

    const parsed = loadTransactionsFromCSV(csvText);
    const currentStore = getDemoStore();
    const { nextTransactions, imported, skipped } = appendImportedTransactions(
      currentStore.transactions,
      parsed,
    );

    updateDemoStore((current) => ({
      ...current,
      transactions: nextTransactions,
    }));

    return jsonResponse({
      ok: true,
      importedCount: imported.length,
      transactions: imported,
      sample: imported.slice(0, 50),
      skipped,
    });
  }

  if (pathname === "/api/reports/export" && method === "GET") {
    const years = (url.searchParams.get("years") || "")
      .split(",")
      .filter(Boolean);
    const categories = parseTransactionCategoryFilters(
      url.searchParams.get("categories"),
    );
    const tags = (url.searchParams.get("tags") || "")
      .split(",")
      .filter(Boolean);
    const filtered = filterTransactions(getDemoStore().transactions, {
      years,
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate"),
      categories,
      tags,
      search: url.searchParams.get("search") ?? "",
    });
    const csv = transactionsToCsv(filtered);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions_export.csv"',
      },
    });
  }

  return null;
}
