import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../../lib/auth";
import { normalizeBudgetForStorage } from "../../../../lib/budget-planner";
import { deleteBudget, putBudget } from "../../../../lib/dynamo";
import { BudgetSchema } from "../../../../lib/schemas";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id } = await context.params;
    await deleteBudget(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id } = await context.params;
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

    const payload = parseResult.data;
    const now = new Date().toISOString();
    const updated = await putBudget(
      userId,
      normalizeBudgetForStorage({
        ...payload,
        budgetId: id,
        createdAt: payload.createdAt,
        updatedAt: now,
      }),
    );
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
