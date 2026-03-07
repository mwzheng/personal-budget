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

    const csvPath = join(process.cwd(), "sample-data", "expenses.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    const allTransactions = loadTransactionsFromCSV(csvContent);

    const filtered = filterTransactions(allTransactions, {
      startDate,
      endDate,
      tags,
      search,
    });

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
