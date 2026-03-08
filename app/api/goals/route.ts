import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../lib/auth";
import { getUserGoals, putGoal, deleteGoal } from "../../../lib/dynamo";
import { estimateGoalETA } from "../../../lib/goals";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const goals = await getUserGoals(userId);
    const withEta = goals.map((g) => ({ ...g, eta: estimateGoalETA(g) }));
    return NextResponse.json({ ok: true, goals: withEta });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const g = body || {};
    const created = await putGoal(userId, g);
    const eta = estimateGoalETA(created as any);
    return NextResponse.json({ ok: true, created, eta });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const g = body || {};
    if (!g.goalId) return NextResponse.json({ ok: false, error: 'Missing goalId for update' }, { status: 400 });
    const updated = await putGoal(userId, g);
    const eta = estimateGoalETA(updated as any);
    return NextResponse.json({ ok: true, updated, eta });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    let goalId: string | undefined;
    try {
      const body = await request.json();
      goalId = body?.goalId;
    } catch (_) {
      // ignore
    }
    if (!goalId) {
      const url = new URL(request.url);
      goalId = url.searchParams.get('goalId') || undefined;
    }
    if (!goalId) return NextResponse.json({ ok: false, error: 'Missing goalId' }, { status: 400 });
    await deleteGoal(userId, goalId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
