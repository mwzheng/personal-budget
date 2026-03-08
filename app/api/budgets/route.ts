import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromRequest } from "../../../lib/auth";
import { getUserBudgets, putBudget } from "../../../lib/dynamo";

const BudgetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  allocations: z.record(z.number()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const budgets = await getUserBudgets(userId);
    return NextResponse.json({ ok: true, budgets });
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
    const parseResult = BudgetSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "validation_error",
            issues: parseResult.error.format(),
          },
        },
        { status: 422 },
      );
    }
    const bud = parseResult.data;
    // Ensure timestamps / id are set server-side if missing
    const now = new Date().toISOString();
    (bud as any).createdAt = (bud as any).createdAt || now;
    (bud as any).updatedAt = now;

    const created = await putBudget(userId, bud as any);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
