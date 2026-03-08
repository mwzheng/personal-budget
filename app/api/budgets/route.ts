import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../lib/auth";
import { getUserBudgets, putBudget } from "../../../lib/dynamo";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const budgets = await getUserBudgets(userId);
    return NextResponse.json({ ok: true, budgets });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const bud = body || {};
    const created = await putBudget(userId, bud);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
