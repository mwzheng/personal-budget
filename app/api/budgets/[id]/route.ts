import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/auth";
import { normalizeBudgetForStorage } from "@/lib/utils/budget-planner";
import { deleteBudget, putBudget } from "@/lib/api/dynamo";
import { BudgetSchema } from "@/lib/schemas/schemas";
import {
  budgetRouteErrorResponse,
  budgetRouteUnauthorizedResponse,
} from "../error-response";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await getUserIdFromRequest(request);
  } catch (err) {
    console.error("[/api/budgets/:id DELETE]", err);
    return budgetRouteUnauthorizedResponse();
  }

  try {
    const { id } = await context.params;
    await deleteBudget(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/budgets/:id DELETE]", err);
    return budgetRouteErrorResponse(err, 400, "Unable to delete budget");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await getUserIdFromRequest(request);
  } catch (err) {
    console.error("[/api/budgets/:id PUT]", err);
    return budgetRouteUnauthorizedResponse();
  }

  try {
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
    console.error("[/api/budgets/:id PUT]", err);
    return budgetRouteErrorResponse(err, 400, "Unable to update budget");
  }
}
