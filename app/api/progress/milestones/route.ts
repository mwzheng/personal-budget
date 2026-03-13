import { NextResponse } from "next/server";
import {
  getUserIdFromRequest,
  getPayloadFromRequest,
} from "../../../../lib/auth2";
import { upsertUserProfile } from "../../../../lib/users";
import {
  getUserMilestones,
  putMilestone,
  deleteMilestone,
} from "../../../../lib/progress";

export async function GET(request: Request) {
  try {
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = (payload && (payload as any).sub) as string;
    const entries = await getUserMilestones(userId);
    return NextResponse.json({ ok: true, entries });
  } catch (err) {
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
    const userId = (payload && (payload as any).sub) as string;
    const body = await request.json();
    if (!body || typeof body.amount !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing amount" },
        { status: 400 },
      );
    const created = await putMilestone(userId, body);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = (payload && (payload as any).sub) as string;
    let milestoneId: string | undefined;
    let year: number | undefined;
    try {
      const body = await request.json();
      milestoneId = body?.milestoneId;
      year = body?.year;
    } catch {
      // ignore
    }
    if (!milestoneId) {
      const url = new URL(request.url);
      milestoneId = url.searchParams.get("milestoneId") || undefined;
      year = url.searchParams.get("year")
        ? Number(url.searchParams.get("year"))
        : year;
    }
    if (!milestoneId)
      return NextResponse.json(
        { ok: false, error: "Missing milestoneId" },
        { status: 400 },
      );
    await deleteMilestone(userId, milestoneId, year);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
