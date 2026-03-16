// Note: Utility to normalise allocations provided either as {category,percentage}
// or {category,amount} (weights). Exported for unit testing and reuse.
export type RawAllocation = {
  category: string;
  percentage?: number;
  amount?: number;
};

export type FinalAllocation = { category: string; percentage: number };

export function normalizeAllocations(
  rawAllocations: RawAllocation[],
): FinalAllocation[] {
  const TOLERANCE = 0.01;
  const providedPctSum = rawAllocations.reduce(
    (s, a) => s + (typeof a.percentage === "number" ? a.percentage : 0),
    0,
  );

  const amountItems = rawAllocations.filter(
    (a) => typeof a.percentage !== "number",
  );
  let finalAllocations: FinalAllocation[] = [];

  if (amountItems.length === 0) {
    if (Math.abs(providedPctSum - 100) > TOLERANCE) {
      throw new Error(
        `Allocations must sum to 100% (got ${providedPctSum.toFixed(2)}%)`,
      );
    }
    finalAllocations = rawAllocations.map((a) => ({
      category: a.category,
      percentage: Number(a.percentage as number),
    }));
    return finalAllocations;
  }

  const missingPct = Math.max(0, 100 - providedPctSum);
  const sumAmounts = rawAllocations.reduce(
    (s, a) => s + Number(a.amount ?? 0),
    0,
  );

  if (providedPctSum === 0) {
    if (Math.abs(sumAmounts - 100) <= TOLERANCE) {
      finalAllocations = rawAllocations.map((a) => ({
        category: a.category,
        percentage: Number(a.amount ?? 0),
      }));
    } else {
      if (sumAmounts <= 0) {
        throw new Error(
          "Allocation amounts must be positive numbers or explicit percentages must be provided",
        );
      }
      finalAllocations = rawAllocations.map((a) => ({
        category: a.category,
        percentage: (Number(a.amount ?? 0) / sumAmounts) * 100,
      }));
    }
  } else {
    const amountSumForMissing = amountItems.reduce(
      (s, a) => s + Number(a.amount ?? 0),
      0,
    );
    if (amountSumForMissing <= 0) {
      const even = missingPct / amountItems.length;
      finalAllocations = rawAllocations.map((a) => ({
        category: a.category,
        percentage: typeof a.percentage === "number" ? a.percentage : even,
      }));
    } else {
      finalAllocations = rawAllocations.map((a) => {
        if (typeof a.percentage === "number")
          return { category: a.category, percentage: a.percentage };
        const share = Number(a.amount ?? 0) / amountSumForMissing;
        return { category: a.category, percentage: share * missingPct };
      });
    }

    const finalSum = finalAllocations.reduce((s, a) => s + a.percentage, 0);
    if (Math.abs(finalSum - 100) > 0.5) {
      throw new Error(
        `Allocations could not be normalised to 100% (got ${finalSum.toFixed(2)}%)`,
      );
    }
  }

  return finalAllocations;
}
