import { NextResponse } from "next/server";
import { getPayloadFromRequest } from "../../../../lib/auth2";
import { upsertUserProfile } from "@/lib/auth/users";
import {
  getUserProgressGoals,
  putProgressGoal,
  getUserRetirement,
} from "@/lib/utils/progress";

// Note 1: Keep user extraction in one place to avoid repeating unsafe casts.
function getUserIdFromPayload(payload: Record<string, unknown>): string {
  const sub = payload.sub;
  if (typeof sub !== "string" || !sub) {
    throw new Error("Token missing subject (sub) claim");
  }
  return sub;
}

export async function GET(request: Request) {
  try {
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = getUserIdFromPayload(payload);
    const goals = await getUserProgressGoals(userId);
    const retirement = await getUserRetirement(userId);
    // Note 2: Use a single pass to find the latest year instead of sorting.
    const latest = retirement.reduce<(typeof retirement)[number] | null>(
      (acc, entry) => {
        if (!acc || entry.year > acc.year) return entry;
        return acc;
      },
      null,
    );
    const latestEnd = latest ? Number(latest.endAmount || 0) : 0;
    const enriched = goals.map((g) => ({
      ...g,
      progressPct: g.targetAmount
        ? Math.round((latestEnd / g.targetAmount) * 10000) / 100
        : null,
    }));
    return NextResponse.json({ ok: true, goals: enriched, latestEnd });
  } catch (err) {
    console.error("[/api/progress/goal GET]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = getUserIdFromPayload(payload);
    const body = await request.json();
    if (!body || typeof body.targetAmount !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing targetAmount" },
        { status: 400 },
      );
    const created = await putProgressGoal(userId, body);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[/api/progress/goal POST]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = getUserIdFromPayload(payload);
    const body = await request.json();
    if (!body || !body.goalId || typeof body.targetAmount !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing goalId or targetAmount" },
        { status: 400 },
      );
    const updated = await putProgressGoal(userId, body);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error("[/api/progress/goal PUT]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
