// Note 1: `POST /api/reports/import` accepts a CSV payload and parses it into
// Transaction objects. It then attempts to persist them to DynamoDB when configured,
// or returns the parsed data to the client for client-side import as a fallback.
import { NextRequest, NextResponse } from "next/server";
import { loadTransactionsFromCSV } from "@/lib/csvParser";

export async function POST(request: NextRequest) {
  try {
    // Note 2: Content-type negotiation allows clients to send the CSV either as
    // raw text (`text/csv`) or wrapped in a JSON body (`{ "csv": "..." }`). The
    // raw text path is more efficient for large files; the JSON path is easier to
    // call from JavaScript fetch with a structured request body.
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

    // Attempt to persist to DynamoDB when available
    const imported: any[] = [];
    const skipped: any[] = [];
    // Note 3: Dynamic import with `.catch(() => null)` means the route continues
    // working when the DynamoDB module is unavailable (e.g. missing env vars at
    // build time). The `null` result causes the code to skip the DynamoDB path.
    const clientModule = await import("@/lib/dynamo").catch(() => null);
    const skipAuth =
      process.env.DISABLE_AUTH === "true" || !process.env.COGNITO_USER_POOL_ID;
    let userId = "local-demo";
    if (!skipAuth) {
      userId = await (
        await import("@/lib/cognitoAuth")
      ).requireAuth(request, {
        region: process.env.AWS_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID!,
        audience: process.env.COGNITO_CLIENT_ID,
      });
    }

    if (clientModule && clientModule.putTransaction) {
      for (const t of parsed) {
        // Create id if missing
        const tx = {
          ...t,
          // Note 4: Generating the id here (rather than in csvParser) keeps the
          // parser pure. The random hex suffix adds extra uniqueness in case two
          // rows are imported at the same millisecond (very unlikely but defensive).
          id: t.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        };
        try {
          // Simple idempotency: attempt put; higher-level dedupe by client may be needed
          await clientModule.putTransaction(userId, tx);
          imported.push(tx);
        } catch (err) {
          console.error("Error persisting transaction", err);
          skipped.push({ tx, error: String(err) });
        }
      }
    }

    // Note 5: The response returns `transactions` (full list) and `sample` (first
    // 50 items) so the client can preview the import without transferring the entire
    // dataset over the network if it only needs a preview.
    return NextResponse.json({
      importedCount: imported.length,
      transactions: imported.length ? imported : parsed,
      sample: (imported.length ? imported : parsed).slice(0, 50),
      skipped,
    });
  } catch (error) {
    console.error("[/api/reports/import]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to parse CSV" } },
      { status: 500 },
    );
  }
}
