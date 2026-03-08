import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../lib/auth";
import { getUserTransactions, putTransaction } from "../../../lib/dynamo";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const txs = await getUserTransactions(userId);
    return NextResponse.json({ ok: true, transactions: txs });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const tx = body || {};
    if (!tx.id) tx.id = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Date.now().toString();
    await putTransaction(userId, tx);
    return NextResponse.json({ ok: true, created: tx });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const tx = body || {};
    if (!tx.id) return NextResponse.json({ ok: false, error: 'Missing id for update' }, { status: 400 });
    // For now reuse putTransaction to upsert
    await putTransaction(userId, tx);
    return NextResponse.json({ ok: true, updated: tx });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

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
      id = url.searchParams.get('id') || undefined;
      date = url.searchParams.get('date') || date;
    }
    if (!id || !date) return NextResponse.json({ ok: false, error: 'Missing id or date' }, { status: 400 });
    await (await import('../../../lib/dynamo')).deleteTransaction(userId, id, date);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
