// Note 1: Papa Parse is the most widely used CSV parsing library for JavaScript.
// It handles edge cases such as quoted fields containing commas, multi-line cell
// values, and different line endings (CRLF vs LF) automatically.
import Papa from "papaparse";
import { Transaction, CategoryType } from "../types";

// Note 2: RawCSVRow maps directly to the column headers in the expenses CSV.
// Defining a typed interface (rather than using `any`) lets TypeScript warn us
// if we reference a column name that doesn't exist in the file.
interface RawCSVRow {
  Name: string;
  Amount: string;
  Category: string;
  Date: string;
  Notes: string;
  "Payment Method": string;
  Tags: string;
}

// Note 3: `parseFloat` converts a string to a floating-point number. The regex
// `[$,]` matches either a dollar sign or a comma so amounts like "$1,234.56"
// become 1234.56. The `|| 0` default handles empty or non-numeric strings.
function parseAmount(amountStr: string): number {
  return parseFloat(amountStr.replace(/[$,]/g, "")) || 0;
}

// Note 4: The CSV stores dates as "MM/DD/YYYY" (US locale format). This function
// normalizes them to ISO "YYYY-MM-DD" so they can be sorted lexicographically
// and compared with standard string operations throughout the rest of the app.
function parseDate(dateStr: string): string {
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return dateStr;
  const [month, day, year] = parts;
  // Note 5: `padStart(2, "0")` left-pads single-digit months and days with a
  // zero (e.g. "3" -> "03") to ensure a consistent 10-character date string.
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Note 6: Tags are exported from Notion as comma-separated values where each
// tag may include a hyperlink suffix: "Groceries (https://notion.so/...)".
// This function strips the URL suffix so only the plain tag name is stored.
function parseTags(tagString: string): string[] {
  if (!tagString?.trim()) return [];
  return tagString
    .split(",")
    .map((tag) => {
      const trimmed = tag.trim();
      // Strip Notion URL portion: "TagName (https://...)" → "TagName"
      const idx = trimmed.indexOf(" (");
      return idx !== -1 ? trimmed.substring(0, idx).trim() : trimmed;
    })
    .filter(Boolean);
}

// Note 7: Any unrecognized category value is treated as "Want" (the default
// spending category). This is a defensive fallback: bad CSV data should not
// crash the import or silently produce wrong financial summaries.
function normalizeCategory(raw: string): CategoryType {
  const v = raw?.trim();
  if (v === "Need" || v === "Saving") return v;
  return "Want";
}

/**
 * Note 8: Parses a CSV string into an array of `Transaction` objects.
 * The function is intentionally pure (no side effects, no I/O) so it can be
 * used on both the server (in API routes) and the client (in-browser import).
 */
export function loadTransactionsFromCSV(csvContent: string): Transaction[] {
  // Note 9: A BOM (byte order mark, U+FEFF) is sometimes prepended by Excel or
  // Windows tools when saving UTF-8 CSV files. Stripping it prevents the first
  // column header from being parsed as "\uFEFFName" instead of "Name".
  const content = csvContent.replace(/^\uFEFF/, "");

  const result = Papa.parse<RawCSVRow>(content, {
    // Note 10: `header: true` uses the first row as column keys, so row objects
    // have named fields (e.g. row.Name) instead of positional indices (row[0]).
    header: true,
    skipEmptyLines: true,
  });

  return (
    result.data
      // Note 11: Filter out rows that are missing a name or amount -- these are
      // likely blank rows or footer totals that should not become transactions.
      .filter((row) => row.Name && row.Amount)
      .map(
        (row, index): Transaction => ({
          id: `t-${index}`,
          name: row.Name.trim(),
          amount: parseAmount(row.Amount),
          category: normalizeCategory(row.Category),
          date: parseDate(row.Date),
          notes: row.Notes?.trim() || "",
          paymentMethod: row["Payment Method"]?.trim() || "",
          tags: parseTags(row.Tags),
        }),
      )
      // Note 12: A second filter removes transactions with zero/negative amounts
      // (bad data) and dates that are not exactly 10 characters, which indicates
      // a failed date parse and would break date-range filtering.
      .filter((t) => t.amount > 0 && t.date.length === 10)
  );
}
