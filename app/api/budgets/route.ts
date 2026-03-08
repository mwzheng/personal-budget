// Note 1: `GET /api/budgets` and `POST /api/budgets` serve the Budget CRUD
// resource. Budgets represent a named allocation plan (e.g. "Monthly Plan")
// where spending categories are assigned percentage or dollar targets.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromRequest } from "../../../lib/auth";
import { getUserBudgets, putBudget } from "../../../lib/dynamo";

// Note 2: The Zod schema defines the expected shape of the request body.
// `z.string().min(1)` validates that `name` is a non-empty string. `z.record(z.number())`
// accepts any object whose values are numbers -- e.g. `{ "Food": 200, "Rent": 1500 }`.
const AllocationRecord = z.record(z.number());
const AllocationArray = z
  .array(
    z.object({
      category: z.string(),
      amount: z.number(),
    }),
  )
  .optional();

const BudgetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  // Accept either a record of category->number (legacy clients) or an array
  // of { category, amount } objects (preferred). Normalize below before
  // persisting so the DB always stores an array.
  allocations: z.union([AllocationRecord, AllocationArray]).optional(),
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
      // Note 3: Status 401 (Unauthorized) is returned here because the most
      // likely reason for an error is a missing or invalid auth token. If the
      // token is valid but the user lacks access, 403 (Forbidden) would be more
      // precise -- but that would also reveal the item exists.
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
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
    const bud = parseResult.data;
    // Ensure timestamps / id are set server-side if missing
    // Note 5: Setting `updatedAt` server-side (rather than trusting the client
    // to send a timestamp) prevents clock skew and ensures the database always
    // reflects when the record was last written. `createdAt` is preserved if
    // already present (i.e. during an update) so creation history is not lost.
    const now = new Date().toISOString();
    (bud as any).createdAt = (bud as any).createdAt || now;
    (bud as any).updatedAt = now;

    // Normalize `allocations` so the DB always stores an array of
    // { category, amount } objects. Support legacy record shape too.
    let normalizedAllocations: { category: string; amount: number }[] = [];
    if ((bud as any).allocations) {
      if (Array.isArray((bud as any).allocations)) {
        normalizedAllocations = (bud as any).allocations;
      } else {
        normalizedAllocations = Object.entries((bud as any).allocations).map(
          ([category, amount]) => ({ category, amount: Number(amount) }),
        );
      }
    }
    (bud as any).allocations = normalizedAllocations;

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
