import { NextRequest, NextResponse } from "next/server";
import { loadTransactionsFromCSV } from "@/lib/csvParser";

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
      // fallback: attempt to read raw text
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

    const parsed = loadTransactionsFromCSV(csvText);

    return NextResponse.json({
      importedCount: parsed.length,
      transactions: parsed,
      // Legacy preview alias kept for backward compatibility
      sample: parsed.slice(0, 50),
    });
  } catch (error) {
    console.error("[/api/reports/import]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to parse CSV" } },
      { status: 500 },
    );
  }
}
