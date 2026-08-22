import { NextResponse } from "next/server";
import { getPayloadFromRequest } from "@/lib/auth/auth";
import { upsertUserProfile } from "@/lib/auth/users";
import {
  getUserMilestones,
  putMilestone,
  updateMilestone,
  deleteMilestone,
  MilestoneConflictError,
} from "@/lib/utils/progress";
import {
  MilestoneCreateSchema,
  MilestoneUpdateSchema,
} from "@/lib/schemas/schemas";

// Note 1: Centralize payload -> userId extraction to avoid repeated `any` casts.
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
    const entries = await getUserMilestones(userId);
    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    console.error("[/api/progress/milestones GET]", err);
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
    const parsed = MilestoneCreateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { ok: false, error: "Invalid milestone" },
        { status: 400 },
      );
    const created = await putMilestone(userId, parsed.data);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[/api/progress/milestones POST]", err);
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
    const parsed = MilestoneUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid milestone" },
        { status: 400 },
      );
    }
    const existing = (await getUserMilestones(userId)).find(
      (milestone) => milestone.milestoneId === parsed.data.milestoneId,
    );
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Milestone not found" },
        { status: 404 },
      );
    }
    const updated = await updateMilestone(userId, {
      ...parsed.data,
      originalYear: existing.year,
      createdAt: existing.createdAt,
    });
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    if (err instanceof MilestoneConflictError) {
      return NextResponse.json(
        { ok: false, error: "Milestone was modified. Refresh and try again." },
        { status: 409 },
      );
    }
    console.error("[/api/progress/milestones PUT]", err);
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
    const userId = getUserIdFromPayload(payload);
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
      const rawYear = url.searchParams.get("year");
      if (rawYear) {
        const parsedYear = Number(rawYear);
        if (Number.isFinite(parsedYear)) {
          year = parsedYear;
        }
      }
    }
    if (!milestoneId)
      return NextResponse.json(
        { ok: false, error: "Missing milestoneId" },
        { status: 400 },
      );
    await deleteMilestone(userId, milestoneId, year);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/progress/milestones DELETE]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
