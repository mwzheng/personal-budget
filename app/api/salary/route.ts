// Note 1: `GET/POST/PUT/DELETE /api/salary` manages the user's salary history.
// Year-over-year (YoY) growth is computed on the GET response so the client
// can display it in a chart without extra computation.
import { NextResponse } from "next/server";
import {
  getUserIdFromRequest,
  getPayloadFromRequest,
} from "../../../lib/auth2";
import { upsertUserProfile } from "../../../lib/users";
import { putSalary, getUserSalary, deleteSalary } from "../../../lib/salary";

export async function GET(request: Request) {
  try {
    const payload = await getPayloadFromRequest(request);
    await upsertUserProfile(payload);
    const userId = (payload && (payload as any).sub) as string;
    const entries = await getUserSalary(userId);
    // Note 2: Sorting by year ascending ensures the YoY calculation below can
    // always compare entry[i] against entry[i-1] safely without re-sorting.
    const sorted = entries.sort((a, b) => a.year - b.year);
    const withYoY = sorted.map((e, i) => {
      const prev = i > 0 ? sorted[i - 1] : null;
      // Note 3: YoY growth is (currentAmount - prevAmount) / prevAmount * 100.
      // A null result is returned for the first entry (no prior year to compare)
      // or when the previous salary was 0 (division by zero guard).
      const yoy =
        prev && prev.amount
          ? ((e.amount - prev.amount) / prev.amount) * 100
          : null;
      // Note 4: `Math.round(yoy * 100) / 100` rounds to 2 decimal places.
      // e.g. 5.2345... becomes 5.23. This keeps the payload concise.
      return { ...e, yoy: yoy === null ? null : Math.round(yoy * 100) / 100 };
    });
    return NextResponse.json({ ok: true, entries: withYoY });
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
    // Note 5: Both `year` and `amount` are validated with `typeof ... === "number"`
    // to distinguish missing values from zero (a valid amount). Checking the type
    // rather than truthiness allows `amount: 0` to pass validation.
    if (
      !body ||
      typeof body.year !== "number" ||
      typeof body.amount !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing year or amount" },
        { status: 400 },
      );
    }
    const created = await putSalary(userId, body);
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
    const userId = (payload && (payload as any).sub) as string;
    const body = await request.json();
    if (
      !body ||
      !body.entryId ||
      typeof body.year !== "number" ||
      typeof body.amount !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing entryId/year/amount" },
        { status: 400 },
      );
    }
    const updated = await putSalary(userId, body);
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
    const userId = (payload && (payload as any).sub) as string;
    let entryId: string | undefined;
    let year: number | undefined;
    try {
      const body = await request.json();
      entryId = body?.entryId;
      year = body?.year;
    } catch {
      // ignore
    }
    // Note 6: The identifier is read from the query string as a fallback when the
    // DELETE body is not provided. Some HTTP clients and frameworks do not support
    // request bodies on DELETE requests, so supporting both is more compatible.
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
    // Note 7: `year` is passed separately to `deleteSalary` because it is part
    // of the DynamoDB sort key (`salary#<year>#<entryId>`). Without the year the
    // full key cannot be reconstructed and the delete would fail.
    await deleteSalary(userId, entryId, Number(year));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
