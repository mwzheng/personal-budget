import type { Transaction } from "../types";

// Note 1: The header row defines the column order for the exported file. Keeping
// it in a constant makes it trivial to reorder or add columns in one place without
// touching the row-building logic below.
const CSV_HEADER = [
  "Name",
  "Amount",
  "Category",
  "Date",
  "Notes",
  "Payment Method",
  "Tags",
];

// Note 2: RFC 4180 (the informal CSV standard) requires that any field containing
// a double-quote character be escaped by doubling it (""), and the whole field
// must be wrapped in double quotes. This function applies both transformations.
function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Generates a CSV string from a list of transactions matching the expenses.csv column layout. */
export function transactionsToCsv(transactions: Transaction[]): string {
  const rows = transactions.map((t) => [
    t.name,
    // Note 3: `toFixed(2)` ensures amounts always have exactly 2 decimal places
    // (e.g. "10.00" not "10"). The "$" prefix matches the source CSV format so
    // the exported file can be round-tripped back through the CSV importer.
    `$${t.amount.toFixed(2)}`,
    t.category,
    t.date,
    // Note 4: Newlines inside notes fields would break CSV row boundaries.
    // Replacing them with spaces keeps the data readable without corrupting the
    // CSV structure.
    (t.notes ?? "").replace(/\n/g, " "),
    t.paymentMethod ?? "",
    // Note 5: Tags are joined with ", " to match the format produced by Notion
    // exports, making the output compatible with the CSV importer's tag parser.
    t.tags.join(", "),
  ]);

  // Note 6: `Array.concat` appends the mapped data rows to the header row array.
  // Each row's cells are individually escaped and joined with commas.
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
  // Note 7: `Blob` is a browser API that represents raw binary data. Wrapping
  // the CSV string in a Blob with the correct MIME type ensures the browser
  // treats the downloaded file as a CSV rather than plain text.
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  // Note 8: `URL.createObjectURL` creates a temporary in-memory URL pointing to
  // the Blob. We attach it to an anchor element, programmatically click it to
  // trigger the download, then immediately revoke the URL to free memory.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Note 9: `revokeObjectURL` releases the object URL and its underlying Blob
  // from memory. Forgetting this step can cause small memory leaks in the browser
  // if the user exports many times in a single session.
  URL.revokeObjectURL(url);
}
