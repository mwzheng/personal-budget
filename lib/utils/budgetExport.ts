/**
 * Note 1: Client-side budget export utilities.
 * Produces downloadable JSON and CSV files from a `SavedBudget` snapshot.
 * Both functions follow the same download pattern used in csvExport.ts:
 *   Blob → URL.createObjectURL → anchor click → revokeObjectURL.
 */
import { SavedBudget } from "../types/types";

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Escape a CSV cell value per RFC 4180: wrap in quotes and double any
 * internal double-quotes so commas inside the value don't corrupt column
 * boundaries.
 */
function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Derive a human-readable filename from the budget name (sanitized). */
function safeFilename(name: string): string {
  const base = name.trim() || "untitled-budget";
  // Strip anything that would break a filesystem filename.
  return base.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// JSON export
// ---------------------------------------------------------------------------

/** Build the export payload — mirrors what a re-import would expect. */
function buildJsonPayload(budget: SavedBudget): Record<string, unknown> {
  return {
    name: budget.name,
    monthlyIncome: budget.monthlyIncome ?? 0,
    expenses:
      budget.expenses?.map((e) => ({
        expenseId: e.expenseId,
        name: e.name,
        amount: e.amount,
        category: e.category,
        group: e.group ?? "",
      })) ?? [],
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

/** Download the current budget as a JSON file. */
export function downloadBudgetJson(budget: SavedBudget): void {
  const payload = buildJsonPayload(budget);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${safeFilename(budget.name)}_budget.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/**
 * Build a multi-line CSV string from a budget.
 *
 * Row layout:
 *   Line 1: Budget metadata header (Name, Income)
 *   Line 2: Column headers for expenses
 *   Lines 3+: One row per expense
 */
function buildBudgetCsv(budget: SavedBudget): string {
  const lines = [
    // Metadata line — note the second column is the formatted income value.
    `${escapeCell(budget.name)},${escapeCell(String(budget.monthlyIncome ?? 0))}`,
    // Expense columns header
    ["Expense", "Amount", "Category", "Sankey Path"].map(escapeCell).join(","),
  ];

  for (const expense of budget.expenses ?? []) {
    lines.push(
      [
        escapeCell(expense.name),
        `$${expense.amount.toFixed(2)}`,
        escapeCell(expense.category),
        escapeCell(expense.group ?? ""),
      ].join(","),
    );
  }

  return lines.join("\n");
}

/** Download the current budget as a CSV file. */
export function downloadBudgetCsv(budget: SavedBudget): void {
  const csv = buildBudgetCsv(budget);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${safeFilename(budget.name)}_budget.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
