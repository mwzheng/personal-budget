// Note 1: `z` (Zod) is a schema validation library. Defining schemas for the
// request body provides runtime type checking, automatic coercion, and clear error
// messages -- all without writing manual validation code. Zod throws on invalid
// input, and `safeParse` returns a result object instead of throwing.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Note 2: `z.enum` restricts the `category` field to exactly the three valid
// strings defined in CategoryType. If a caller sends "want" (lowercase), Zod will
// reject it with a descriptive error before any business logic runs.
const AllocationSchema = z.object({
  category: z.enum(["Need", "Want", "Saving"]),
  percentage: z.number().min(0).max(100),
});

// Note 3: `.positive()` means the monthly income must be greater than zero.
// `.min(1)` on allocations ensures at least one allocation is provided, preventing
// division-by-zero or empty Sankey diagrams. `.default("Income")` fills in a
// sensible value when `incomeLabel` is omitted from the request body.
const SankeyBodySchema = z.object({
  monthlyIncome: z.number().positive(),
  incomeLabel: z.string().min(1).default("Income"),
  allocations: z.array(AllocationSchema).min(1),
});

// Note 4: This is the only route in the Sankey module -- it accepts a POST with
// income and allocation percentages and returns the Sankey graph data plus a
// computed budget suggestion (dollar amounts per category).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Note 5: `safeParse` validates the body without throwing. If `success` is
    // false, `parsed.error.message` contains a human-readable description of every
    // validation failure, which we forward to the client as a 400 error.
    const parsed = SankeyBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const { monthlyIncome, incomeLabel, allocations } = parsed.data;

    // Note 6: Floating-point arithmetic can produce values like 99.99999 instead
    // of 100. `Math.abs(totalPct - 100) > 0.01` allows a 0.01% rounding tolerance
    // so valid inputs are not accidentally rejected due to floating-point noise.
    const totalPct = allocations.reduce((sum, a) => sum + a.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: `Allocations must sum to 100% (got ${totalPct.toFixed(1)}%)`,
          },
        },
        { status: 400 },
      );
    }

    // Note 7: Filtering out zero-percentage allocations keeps the Sankey diagram
    // clean by not drawing invisible (zero-value) links. Users may set an
    // allocation to 0% to temporarily disable a category without deleting it.
    const activeAllocations = allocations.filter((a) => a.percentage > 0);

    const nodes = [
      { id: incomeLabel },
      ...activeAllocations.map((a) => ({ id: a.category })),
    ];

    const links = activeAllocations.map((a) => ({
      source: incomeLabel,
      target: a.category,
      // Note 8: `Math.round` converts percentage amounts to whole dollars.
      // This avoids fractional cents (e.g. $833.33...) in the Sankey labels
      // while keeping the total close to `monthlyIncome`.
      value: Math.round((monthlyIncome * a.percentage) / 100),
    }));

    // Note 9: `budgetSuggestion` includes ALL categories (including zero-
    // percentage ones) so the client can display a complete budget breakdown table
    // even for categories that have no Sankey link.
    const budgetSuggestion: Record<string, number> = {};
    for (const a of allocations) {
      budgetSuggestion[a.category] = Math.round(
        (monthlyIncome * a.percentage) / 100,
      );
    }

    return NextResponse.json({
      sankeyData: { nodes, links },
      budgetSuggestion,
    });
  } catch (error) {
    console.error("[/api/sankey]", error);
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to generate sankey" },
      },
      { status: 500 },
    );
  }
}
