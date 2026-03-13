import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../../lib/auth";
import {
  getUserRetirement,
  putRetirement,
  deleteRetirement,
} from "../../../../lib/progress";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const entries = await getUserRetirement(userId);
    const sorted = entries.sort((a: any, b: any) => a.year - b.year);
    const withCalc = sorted.map((e: any) => {
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
    const userId = await getUserIdFromRequest(request);
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
    const userId = await getUserIdFromRequest(request);
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
    const userId = await getUserIdFromRequest(request);
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
      year = url.searchParams.get("year")
        ? Number(url.searchParams.get("year"))
        : year;
    }
    if (!entryId || !year)
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
