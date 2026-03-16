// Note 1: The `?` suffix on a type property marks it as optional. When reading an
// optional field, TypeScript forces you to handle the `undefined` case, which
// prevents common runtime errors like accessing `.currentSaved` on a bare goal
// object that was created without it.
export type Goal = {
  goalId?: string;
  name: string;
  targetAmount: number;
  currentSaved?: number;
  monthlyContribution?: number;
  expectedAnnualReturn?: number; // decimal, e.g., 0.05 for 5%
};

/**
 * Note 2: Calculates how many months it will take to reach `target` given an
 * initial balance, a fixed monthly contribution, and a compound annual return.
 *
 * When there is no return rate the answer is trivially `ceil((target - saved) /
 * contribution)`. With compounding, we simulate month-by-month to avoid solving
 * the closed-form geometric series (which would require logarithms).
 *
 * `maxMonths` (default 600 = 50 years) acts as a safety cap so the loop cannot
 * run forever for unreachable goals (e.g. zero contribution, zero return).
 */
export function monthsToTarget(
  currentSaved: number,
  monthlyContribution: number,
  annualReturn: number,
  target: number,
  maxMonths = 600,
) {
  // Note 3: Short-circuit: if savings already meet the target, no time needed.
  if (currentSaved >= target) return 0;

  // Note 4: Convert an annual return (e.g. 0.07 for 7%) to an equivalent monthly
  // rate using the 12th root: (1 + r_annual)^(1/12) - 1. This is mathematically
  // correct because compound interest compounds multiplicatively, not additively.
  const monthlyRate =
    annualReturn && annualReturn > 0
      ? Math.pow(1 + annualReturn, 1 / 12) - 1
      : 0;

  // Note 5: Without growth, the math is a simple linear division.
  if (monthlyRate === 0) {
    if (!monthlyContribution || monthlyContribution <= 0) return Infinity;
    return Math.ceil((target - currentSaved) / monthlyContribution);
  }

  // Note 6: Month-by-month simulation of compound growth + contributions.
  // Each period: new_balance = old_balance * (1 + monthlyRate) + contribution
  let months = 0;
  let balance = currentSaved;
  while (balance < target && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + (monthlyContribution || 0);
    months++;
  }

  // Note 7: If we hit `maxMonths` without reaching the target, return Infinity
  // to signal that the goal is unreachable with the current inputs.
  return months >= maxMonths ? Infinity : months;
}

/**
 * Note 8: Wraps `monthsToTarget` to return a human-friendly ETA object that
 * includes a projected ISO date string. `isFinite` guards against the Infinity
 * case so callers do not have to handle it separately.
 */
export function estimateGoalETA(goal: Goal) {
  const months = monthsToTarget(
    goal.currentSaved ?? 0,
    goal.monthlyContribution ?? 0,
    goal.expectedAnnualReturn ?? 0,
    goal.targetAmount,
  );
  if (!isFinite(months)) return { months: Infinity, projectedDate: null };
  const projected = new Date();
  // Note 9: `setMonth` correctly handles year overflow -- e.g. month 13 rolls
  // over to January of the next year. JavaScript's Date arithmetic handles this.
  projected.setMonth(projected.getMonth() + months);
  return { months, projectedDate: projected.toISOString() };
}
