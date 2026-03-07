import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AllocationSchema = z.object({
  category: z.enum(["Need", "Want", "Saving"]),
  percentage: z.number().min(0).max(100),
});

const SankeyBodySchema = z.object({
  monthlyIncome: z.number().positive(),
  incomeLabel: z.string().min(1).default("Income"),
  allocations: z.array(AllocationSchema).min(1),
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

    const { monthlyIncome, incomeLabel, allocations } = parsed.data;

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

    const activeAllocations = allocations.filter((a) => a.percentage > 0);

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
