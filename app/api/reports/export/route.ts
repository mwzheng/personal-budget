// Note 1: `GET /api/reports/export` streams a filtered CSV directly from the
// server to the browser. Returning a `Response` (not `NextResponse.json`) with
// appropriate headers triggers a file download dialog in the browser.
import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { loadTransactionsFromCSV } from "@/lib/csvParser";
import { filterTransactions } from "@/lib/aggregations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
    const search = searchParams.get("search") ?? "";

    // Note 2: `readFileSync` reads the sample CSV file synchronously. This is
    // acceptable for a server route handler because Next.js runs it in a Node.js
    // context (not a browser) and the file is small. For user-uploaded files or
    // DynamoDB data, the async `getUserTransactions` function should be used instead.
    const csvPath = join(process.cwd(), "sample-data", "expenses.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    const allTransactions = loadTransactionsFromCSV(csvContent);

    const filtered = filterTransactions(allTransactions, {
      startDate,
      endDate,
      tags,
      search,
    });

    // Note 3: Each cell in the CSV is wrapped in double quotes and internal quotes
    // are escaped by doubling them, following RFC 4180. This prevents commas or
    // newlines inside cell values from breaking the CSV structure.
    const header = [
      "Name",
      "Amount",
      "Category",
      "Date",
      "Notes",
      "Payment Method",
      "Tags",
    ];

    const rows = filtered.map((t) => [
      t.name,
      `$${t.amount.toFixed(2)}`,
      t.category,
      t.date,
      (t.notes || "").replace(/\n/g, " "),
      t.paymentMethod || "",
      t.tags.join(", "),
    ]);

    const csv = [header.join(",")]
      .concat(
        rows.map((r) =>
          r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        ),
      )
      .join("\n");

    // Note 4: The `Content-Disposition: attachment` header instructs the browser
    // to download the response as a file rather than displaying it inline.
    // The `filename` parameter suggests the default name for the saved file.
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions_export.csv"',
      },
    });
  } catch (error) {
    console.error("[/api/reports/export]", error);
    return new Response("Failed to export CSV", { status: 500 });
  }
}
