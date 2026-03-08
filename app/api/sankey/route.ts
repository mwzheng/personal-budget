// Note 1: `z` (Zod) is a schema validation library. Defining schemas for the
// request body provides runtime type checking, automatic coercion, and clear error
// messages. This route accepts allocations either as `{ category, percentage }`
// or the existing `{ category, amount }` shape persisted by the budgets API and
// normalises them to percentages so the Sankey generator works with both shapes.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AllocationInput = z
  .object({
    category: z.string(),
    // Accept either an explicit percentage (0-100) or an amount/weight.
    percentage: z.number().min(0).max(100).optional(),
    amount: z.number().min(0).optional(),
  })
  .refine(
    (a) => typeof a.percentage === "number" || typeof a.amount === "number",
    {
      message: "Each allocation must include either `percentage` or `amount`",
    },
  );

const SankeyBodySchema = z.object({
  monthlyIncome: z.number().positive(),
  incomeLabel: z.string().min(1).default("Income"),
  allocations: z.array(AllocationInput).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SankeyBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const { monthlyIncome, incomeLabel } = parsed.data;
    const rawAllocations = parsed.data.allocations;

    // Compute the sum of any explicitly provided percentages.
    const providedPctSum = rawAllocations.reduce(
      (s, a) => s + (typeof a.percentage === "number" ? a.percentage : 0),
      0,
    );

    // Items that need their percentage derived from `amount`.
    const amountItems = rawAllocations.filter(
      (a) => typeof a.percentage !== "number",
    );

    let finalAllocations: { category: string; percentage: number }[] = [];

    const TOLERANCE = 0.01; // 0.01% tolerance to allow tiny floating point noise

    if (amountItems.length === 0) {
      // All allocations provided as percentages.
      if (Math.abs(providedPctSum - 100) > TOLERANCE) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_INPUT",
              message: `Allocations must sum to 100% (got ${providedPctSum.toFixed(2)}%)`,
            },
          },
          { status: 400 },
        );
      }

      finalAllocations = rawAllocations.map((a) => ({
        category: a.category,
        percentage: Number(a.percentage as number),
      }));
    } else {
      // Some or all allocations provided as `amount` (weights). Mix of explicit
      // percentages and amounts is supported: percentages reserve part of the
      // 100% budget, and the remaining percentage is distributed proportionally
      // to the `amount` values among the amount-based items.

      if (providedPctSum > 100 + TOLERANCE) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_INPUT",
              message: `Provided percentages exceed 100% (got ${providedPctSum.toFixed(2)}%)`,
            },
          },
          { status: 400 },
        );
      }

      const missingPct = Math.max(0, 100 - providedPctSum);

      // If none of the items supplied percentages (i.e., providedPctSum === 0),
      // interpret `amount` values either as direct percentages (if they already
      // sum to ~100) or as relative weights which we scale to 100.
      const sumAmounts = rawAllocations.reduce(
        (s, a) => s + Number(a.amount ?? 0),
        0,
      );

      if (providedPctSum === 0) {
        if (Math.abs(sumAmounts - 100) <= TOLERANCE) {
          // Amounts already represent percentages (legacy case), use them as-is.
          finalAllocations = rawAllocations.map((a) => ({
            category: a.category,
            percentage: Number(a.amount ?? 0),
          }));
        } else {
          if (sumAmounts <= 0) {
            return NextResponse.json(
              {
                error: {
                  code: "INVALID_INPUT",
                  message:
                    "Allocation amounts must be positive numbers or explicit percentages must be provided",
                },
              },
              { status: 400 },
            );
          }
          // Scale amounts to percentages summing to 100.
          finalAllocations = rawAllocations.map((a) => ({
            category: a.category,
            percentage: (Number(a.amount ?? 0) / sumAmounts) * 100,
          }));
        }
      } else {
        // Some items provided explicit percentages; distribute the remaining
        // percentage proportionally to the amount-based items.
        const amountSumForMissing = amountItems.reduce(
          (s, a) => s + Number(a.amount ?? 0),
          0,
        );
        if (amountSumForMissing <= 0) {
          // If no weights are provided for the remaining items, split missing
          // percentage evenly among them.
          const even = missingPct / amountItems.length;
          finalAllocations = rawAllocations.map((a) => ({
            category: a.category,
            percentage: typeof a.percentage === "number" ? a.percentage : even,
          }));
        } else {
          finalAllocations = rawAllocations.map((a) => {
            if (typeof a.percentage === "number") {
              return { category: a.category, percentage: a.percentage };
            }
            const share = Number(a.amount ?? 0) / amountSumForMissing;
            return { category: a.category, percentage: share * missingPct };
          });
        }
      }

      // Final sanity check: ensure the computed percentages sum to ~100.
      const finalSum = finalAllocations.reduce((s, a) => s + a.percentage, 0);
      if (Math.abs(finalSum - 100) > 0.5) {
        // Allow a bit more slack after proportional rounding; if it's still off
        // by more than 0.5%, treat as an input error.
        return NextResponse.json(
          {
            error: {
              code: "INVALID_INPUT",
              message: `Allocations could not be normalised to 100% (got ${finalSum.toFixed(2)}%)`,
            },
          },
          { status: 400 },
        );
      }
    }

    // Remove zero-percentage allocations so the Sankey is not cluttered.
    const activeAllocations = finalAllocations.filter((a) => a.percentage > 0);

    const nodes = [
      { id: incomeLabel },
      ...activeAllocations.map((a) => ({ id: a.category })),
    ];

    const links = activeAllocations.map((a) => ({
      source: incomeLabel,
      target: a.category,
      value: Math.round((monthlyIncome * a.percentage) / 100),
    }));

    const budgetSuggestion: Record<string, number> = {};
    for (const a of finalAllocations) {
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
