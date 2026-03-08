// Note 1: A ProjectionPoint represents the predicted account balance at a single
// future month. The `month` field (1-based integer) is convenient for chart axes,
// while `date` (ISO string) enables human-readable labels on tooltips.
export type ProjectionPoint = { month: number; date: string; balance: number };

/**
 * Note 2: Computes a month-by-month projection of savings growth using the
 * standard compound-interest recurrence:
 *   balance(n) = balance(n-1) * (1 + monthlyRate) + contribution
 *
 * This is the Future Value of a series formula used in personal finance.
 * Each returned point represents the end-of-month balance after contributions.
 */
export function computeProjection(
  currentSaved: number,
  monthlyContribution: number,
  annualReturn: number,
  months: number,
): ProjectionPoint[] {
  // Note 3: Convert annual percentage return to a monthly rate via the 12th root.
  // Using Math.pow(1 + r, 1/12) - 1 is correct for compound interest; simply
  // dividing by 12 would underestimate growth for high annual rates.
  const monthlyRate =
    annualReturn && annualReturn > 0
      ? Math.pow(1 + annualReturn, 1 / 12) - 1
      : 0;
  let balance = currentSaved;
  const now = new Date();
  const points: ProjectionPoint[] = [];
  for (let i = 1; i <= months; i++) {
    // Note 4: Apply growth first, then add the contribution (end-of-period model).
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    // Note 5: Constructing a Date with (year, month + i, day) correctly rolls over
    // month and year boundaries. JavaScript months are 0-indexed, so adding `i`
    // to the current month integer steps forward by exactly i calendar months.
    const d = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
    points.push({
      month: i,
      date: d.toISOString(),
      // Note 6: Round to 2 decimal places to avoid floating-point noise like
      // 10000.000000000002 appearing in chart tooltips.
      balance: Math.round(balance * 100) / 100,
    });
  }
  return points;
}

/**
 * Note 7: Convenience wrapper that accepts years rather than months.
 * `Math.max(1, ...)` guarantees at least one data point even if the caller
 * passes 0 or a fractional year less than 1/12.
 */
export function projectYears(
  currentSaved: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number,
) {
  return computeProjection(
    currentSaved,
    monthlyContribution,
    annualReturn,
    Math.max(1, Math.round(years * 12)),
  );
}
