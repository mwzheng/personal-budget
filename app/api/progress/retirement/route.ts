import { NextResponse } from "next/server";
import { getPayloadFromRequest } from "../../../../lib/auth2";
import { upsertUserProfile } from "@/lib/auth/users";
import {
  getUserRetirement,
  putRetirement,
  deleteRetirement,
} from "@/lib/utils/progress";

// Note 1: Keep subject extraction in one helper for stricter type safety.
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
    const entries = await getUserRetirement(userId);
    // Note 2: Sort a copy so the original array remains unchanged.
    const sorted = [...entries].sort((a, b) => a.year - b.year);
    const withCalc = sorted.map((e) => {
      const change = Number(e.endAmount || 0) - Number(e.startAmount || 0);
      const pct = e.startAmount ? (change / e.startAmount) * 100 : null;
      return {
        ...e,
        change,
        pct: pct === null ? null : Math.round(pct * 100) / 100,
      };
    });
    return NextResponse.json({ ok: true, entries: withCalc });
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
    const userId = getUserIdFromPayload(payload);
    const body = await request.json();
    if (!body || typeof body.year !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing year" },
        { status: 400 },
      );
    if (
      typeof body.startAmount !== "number" ||
      typeof body.endAmount !== "number"
    )
      return NextResponse.json(
        { ok: false, error: "Missing amounts" },
        { status: 400 },
      );
    const created = await putRetirement(userId, body);
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
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = getUserIdFromPayload(payload);
    const body = await request.json();
    if (!body || !body.entryId || typeof body.year !== "number")
      return NextResponse.json(
        { ok: false, error: "Missing entryId/year" },
        { status: 400 },
      );
    const updated = await putRetirement(userId, body);
    return NextResponse.json({ ok: true, updated });
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
    const userId = getUserIdFromPayload(payload);
    let entryId: string | undefined;
    let year: number | undefined;
    try {
      const body = await request.json();
      entryId = body?.entryId;
      year = body?.year;
    } catch {
      // ignore
    }
    if (!entryId) {
      const url = new URL(request.url);
      entryId = url.searchParams.get("entryId") || undefined;
      const rawYear = url.searchParams.get("year");
      if (rawYear) {
        const parsedYear = Number(rawYear);
        if (Number.isFinite(parsedYear)) {
          year = parsedYear;
        }
      }
    }
    if (!entryId || year === undefined)
      return NextResponse.json(
        { ok: false, error: "Missing entryId or year" },
        { status: 400 },
      );
    await deleteRetirement(userId, entryId, Number(year));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
