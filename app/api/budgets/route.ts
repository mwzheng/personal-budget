// Note 1: `GET /api/budgets` and `POST /api/budgets` serve the Budget CRUD
// resource. Budgets now store expense rows plus monthly income so the page can
// render both the pie chart and the grouped Sankey view from one saved payload.
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/auth";
import { normalizeBudgetForStorage } from "@/lib/utils/budget-planner";
import { getUserBudgets, putBudget } from "@/lib/api/dynamo";
import { BudgetSchema } from "@/lib/schemas/schemas";
import {
  budgetRouteErrorResponse,
  budgetRouteUnauthorizedResponse,
} from "./error-response";

// Note: Budget schema centralised in lib/schemas.ts to keep validation consistent across routes.
// See lib/schemas.ts for the canonical BudgetSchema.

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = await getUserIdFromRequest(request);
  } catch (err) {
    console.error("[/api/budgets GET]", err);
    return budgetRouteUnauthorizedResponse();
  }

  try {
    const budgets = await getUserBudgets(userId);
    return NextResponse.json({ ok: true, budgets });
  } catch (err) {
    console.error("[/api/budgets GET]", err);
    // Note 3: Status 401 (Unauthorized) is retained for this route's existing
    // error behavior, while the response body remains safe for clients.
    return budgetRouteErrorResponse(err, 401, "Unable to load budgets");
  }
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getUserIdFromRequest(request);
  } catch (err) {
    console.error("[/api/budgets POST]", err);
    return budgetRouteUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    // Note 4: `safeParse` returns a `{ success, data, error }` discriminated
    // union instead of throwing. This makes the validation result explicit and
    // allows returning a structured 422 error (Unprocessable Entity) with field-
    // level validation issues rather than an unhandled exception.
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
    const budget = parseResult.data;
    // Ensure timestamps / id are set server-side if missing
    // Note 5: Setting `updatedAt` server-side (rather than trusting the client
    // to send a timestamp) prevents clock skew and ensures the database always
    // reflects when the record was last written. `createdAt` is preserved if
    // already present (i.e. during an update) so creation history is not lost.
    const now = new Date().toISOString();
    const created = await putBudget(
      userId,
      normalizeBudgetForStorage({
        ...budget,
        createdAt: budget.createdAt || now,
        updatedAt: now,
      }),
    );
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[/api/budgets POST]", err);
    return budgetRouteErrorResponse(err, 400, "Unable to save budget");
  }
}
