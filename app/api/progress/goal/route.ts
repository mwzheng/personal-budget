import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../../lib/auth";
import {
  getUserProgressGoals,
  putProgressGoal,
  getUserRetirement,
} from "../../../../lib/progress";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const goals = await getUserProgressGoals(userId);
    const goalsSorted = goals;
    const retirement = await getUserRetirement(userId);
    const latest = retirement
      .sort((a: any, b: any) => a.year - b.year)
      .slice(-1)[0];
    const latestEnd = latest ? Number(latest.endAmount || 0) : 0;
    const enriched = goalsSorted.map((g: any) => ({
      ...g,
      progressPct: g.targetAmount
        ? Math.round((latestEnd / g.targetAmount) * 10000) / 100
        : null,
    }));
    return NextResponse.json({ ok: true, goals: enriched, latestEnd });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    if (!body || typeof body.targetAmount !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing targetAmount" },
        { status: 400 },
      );
    const created = await putProgressGoal(userId, body);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    if (!body || !body.goalId || typeof body.targetAmount !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing goalId or targetAmount" },
        { status: 400 },
      );
    const updated = await putProgressGoal(userId, body);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
