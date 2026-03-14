// Note 1: `POST /api/reports/import` persists CSV rows to the authenticated
// user's account only. The client may preview the CSV locally, but the server is
// the only place where imported rows are actually written.
import { NextRequest, NextResponse } from "next/server";
import { loadTransactionsFromCSV } from "@/lib/csvParser";
import { putTransaction } from "@/lib/dynamo";
import { getRequestUserId } from "@/lib/requestUser";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let csvText = "";

    if (
      contentType.includes("text/csv") ||
      contentType.includes("application/csv")
    ) {
      csvText = await request.text();
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      csvText = body.csv ?? "";
    } else {
      csvText = await request.text();
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "No CSV payload provided" },
        },
        { status: 400 },
      );
    }

    const userId = await getRequestUserId(request);
    const parsed = loadTransactionsFromCSV(csvText);
    const imported: Array<Record<string, unknown>> = [];
    const skipped: Array<Record<string, unknown>> = [];

    for (const transaction of parsed) {
      const tx = {
        ...transaction,
        // Note 2: The importer assigns a stable id server-side so the stored rows
        // do not depend on the preview client keeping any local placeholder ids.
        id:
          transaction.id ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      try {
        await putTransaction(userId, tx);
        imported.push(tx);
      } catch (error) {
        console.error("Error persisting imported transaction", error);
        skipped.push({ tx, error: String(error) });
      }
    }

    return NextResponse.json({
      importedCount: imported.length,
      transactions: imported,
      sample: imported.slice(0, 50),
      skipped,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[/api/reports/import]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to import CSV" } },
      { status: 500 },
    );
  }
}
