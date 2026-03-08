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

    // Attempt to persist to DynamoDB when available
    const imported: any[] = [];
    const skipped: any[] = [];
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
