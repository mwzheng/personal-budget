// Note 1: `GET/POST/PUT/DELETE /api/goals` manages savings goals. A goal has a
// target amount, a starting balance, and a monthly contribution. The route
// augments each goal with an `eta` field calculated by `estimateGoalETA`.
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/auth";
import { getUserGoals, putGoal, deleteGoal } from "@/lib/api/dynamo";
import { estimateGoalETA } from "@/lib/utils/goals";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const goals = await getUserGoals(userId);
    // Note 2: `estimateGoalETA` simulates month-by-month compound growth and
    // returns the number of months until the target is reached. By computing it
    // here (server-side) the client receives enriched objects and does not need
    // to implement the financial math itself.
    const withEta = goals.map((g) => ({ ...g, eta: estimateGoalETA(g) }));
    return NextResponse.json({ ok: true, goals: withEta });
  } catch (err) {
    console.error("[/api/goals GET]", err);
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
    // Note 3: `body || {}` prevents `putGoal` from receiving `null` if the client
    // sends an empty body. Zod validation is not used on this route -- the dynamo
    // layer assigns defaults for any missing fields.
    const g = body || {};
    const created = await putGoal(userId, g);
    const eta = estimateGoalETA(created as any);
    return NextResponse.json({ ok: true, created, eta });
  } catch (err) {
    console.error("[/api/goals POST]", err);
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
    const g = body || {};
    // Note 4: `goalId` is required for updates because it maps to the DynamoDB
    // sort key (`goal#<goalId>`). Without it we cannot target the correct item,
    // so we return 400 (Bad Request) rather than accidentally creating a new goal.
    if (!g.goalId)
      return NextResponse.json(
        { ok: false, error: "Missing goalId for update" },
        { status: 400 },
      );
    const updated = await putGoal(userId, g);
    const eta = estimateGoalETA(updated as any);
    return NextResponse.json({ ok: true, updated, eta });
  } catch (err) {
    console.error("[/api/goals PUT]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    let goalId: string | undefined;
    try {
      const body = await request.json();
      goalId = body?.goalId;
    } catch {
      // ignore
    }
    // Note 5: The `goalId` is accepted either from the JSON body or from the
    // query string (`?goalId=...`). Supporting both patterns lets clients issue
    // `DELETE /api/goals?goalId=<id>` (idiomatic REST) or send a body (useful
    // in contexts where DELETE-with-body is easier to construct).
    if (!goalId) {
      const url = new URL(request.url);
      goalId = url.searchParams.get("goalId") || undefined;
    }
    if (!goalId)
      return NextResponse.json(
        { ok: false, error: "Missing goalId" },
        { status: 400 },
      );
    await deleteGoal(userId, goalId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/goals DELETE]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
