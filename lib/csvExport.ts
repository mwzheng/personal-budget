import type { Transaction } from "./types";

const CSV_HEADER = [
  "Name",
  "Amount",
  "Category",
  "Date",
  "Notes",
  "Payment Method",
  "Tags",
];

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Generates a CSV string from a list of transactions matching the expenses.csv column layout. */
export function transactionsToCsv(transactions: Transaction[]): string {
  const rows = transactions.map((t) => [
    t.name,
    `$${t.amount.toFixed(2)}`,
    t.category,
    t.date,
    (t.notes ?? "").replace(/\n/g, " "),
    t.paymentMethod ?? "",
    t.tags.join(", "),
  ]);

  const lines = [CSV_HEADER.join(",")].concat(
    rows.map((r) => r.map((cell) => escapeCell(String(cell))).join(",")),
  );

  return lines.join("\n");
}

/** Triggers a browser download of a CSV file containing the given transactions. */
export function downloadTransactionsCsv(
  transactions: Transaction[],
  filename = "transactions_export.csv",
): void {
  const csv = transactionsToCsv(transactions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
