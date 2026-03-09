import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromRequest } from "../../../../lib/auth";
import { deleteBudget, putBudget } from "../../../../lib/dynamo";

const BudgetSchema = z.object({
  name: z.string().min(1).optional(),
  allocations: z
    .union([
      z.record(z.number()),
      z.array(z.object({ category: z.string().min(1), amount: z.number() })),
    ])
    .optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

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
    // Normalize allocations to array form expected by lib.putBudget
    let allocationsArray: { category: string; amount: number }[] = [];
    if (payload.allocations) {
      if (Array.isArray(payload.allocations)) {
        allocationsArray = payload.allocations as any;
      } else {
        allocationsArray = Object.entries(payload.allocations).map(
          ([k, v]) => ({
            category: k,
            amount: Number(v as any) || 0,
          }),
        );
      }
    }

    const now = new Date().toISOString();
    const bud = {
      budgetId: id,
      name: payload.name || "",
      allocations: allocationsArray,
      createdAt: payload.createdAt,
      updatedAt: now,
    } as any;

    const updated = await putBudget(userId, bud);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
