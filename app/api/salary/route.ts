import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../lib/auth";
import { putSalary, getUserSalary, deleteSalary } from "../../../lib/salary";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const entries = await getUserSalary(userId);
    const sorted = entries.sort((a, b) => a.year - b.year);
    const withYoY = sorted.map((e, i) => {
      const prev = i > 0 ? sorted[i - 1] : null;
      const yoy = prev && prev.amount ? ((e.amount - prev.amount) / prev.amount) * 100 : null;
      return { ...e, yoy: yoy === null ? null : Math.round(yoy * 100) / 100 };
    });
    return NextResponse.json({ ok: true, entries: withYoY });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    if (!body || typeof body.year !== 'number' || typeof body.amount !== 'number') {
      return NextResponse.json({ ok: false, error: 'Missing year or amount' }, { status: 400 });
    }
    const created = await putSalary(userId, body);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    if (!body || !body.entryId || typeof body.year !== 'number' || typeof body.amount !== 'number') {
      return NextResponse.json({ ok: false, error: 'Missing entryId/year/amount' }, { status: 400 });
    }
    const updated = await putSalary(userId, body);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
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
    } catch (_) {}
    if (!entryId) {
      const url = new URL(request.url);
      entryId = url.searchParams.get('entryId') || undefined;
      year = url.searchParams.get('year') ? Number(url.searchParams.get('year')) : year;
    }
    if (!entryId || !year) return NextResponse.json({ ok: false, error: 'Missing entryId or year' }, { status: 400 });
    await deleteSalary(userId, entryId, Number(year));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
