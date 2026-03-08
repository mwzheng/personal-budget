// Note 1: In Next.js App Router, a file named `route.ts` inside `app/api/...`
// becomes an HTTP endpoint. Exporting async functions named `GET`, `POST`, `PUT`,
// and `DELETE` maps them to the corresponding HTTP methods automatically.
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../lib/auth";
import { getUserTransactions, putTransaction } from "../../../lib/dynamo";

// Note 2: `GET /api/transactions` returns all transactions for the authenticated
// user. Authentication is performed by `getUserIdFromRequest`, which validates the
// Bearer JWT in the Authorization header before any data is read.
export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const txs = await getUserTransactions(userId);
    return NextResponse.json({ ok: true, transactions: txs });
  } catch (err) {
    // Note 3: Returning a 401 status code tells the client the request failed due
    // to authentication (not a server error). The error string is included in the
    // body for debugging purposes -- in production you may want to sanitize this.
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 401 },
    );
  }
}

// Note 4: `POST /api/transactions` creates a new transaction. If no `id` is
// provided in the request body, one is generated server-side using `crypto.randomUUID`.
// This allows clients to omit the id and let the server assign it.
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const tx = body || {};
    if (!tx.id)
      tx.id =
        typeof crypto !== "undefined" && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : Date.now().toString();
    await putTransaction(userId, tx);
    return NextResponse.json({ ok: true, created: tx });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

// Note 5: `PUT /api/transactions` updates an existing transaction. DynamoDB's
// `putTransaction` function performs an upsert (create-or-replace), so PUT and
// POST share the same underlying data layer. The `id` field is required for PUT
// to ensure we update the correct item.
export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const tx = body || {};
    if (!tx.id)
      return NextResponse.json(
        { ok: false, error: "Missing id for update" },
        { status: 400 },
      );
    // For now reuse putTransaction to upsert
    await putTransaction(userId, tx);
    return NextResponse.json({ ok: true, updated: tx });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

// Note 6: `DELETE /api/transactions` accepts the transaction `id` and `date`
// either as a JSON body or as URL query parameters. Both channels are tried so
// callers can use whichever is more convenient (fetch with body, or a GET-style
// delete URL). The `date` is required because it is part of the DynamoDB sort key.
export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    // Accept JSON body { id, date } or query params
    let id: string | undefined;
    let date: string | undefined;
    try {
      const body = await request.json();
      id = body?.id;
      date = body?.date;
    } catch (_) {
      // ignore
    }
    if (!id) {
      const url = new URL(request.url);
      id = url.searchParams.get("id") || undefined;
      date = url.searchParams.get("date") || date;
    }
    if (!id || !date)
      return NextResponse.json(
        { ok: false, error: "Missing id or date" },
        { status: 400 },
      );
    // Note 7: Dynamic import is used here to lazy-load the DynamoDB module only
    // when a DELETE is actually performed. This can reduce cold start time in
    // serverless environments where not every invocation deletes data.
    await (
      await import("../../../lib/dynamo")
    ).deleteTransaction(userId, id, date);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
