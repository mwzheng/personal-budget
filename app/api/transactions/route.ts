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
