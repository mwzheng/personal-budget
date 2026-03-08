export type Goal = {
  goalId?: string;
  name: string;
  targetAmount: number;
  currentSaved?: number;
  monthlyContribution?: number;
  expectedAnnualReturn?: number; // decimal, e.g., 0.05 for 5%
};

export function monthsToTarget(
  currentSaved: number,
  monthlyContribution: number,
  annualReturn: number,
  target: number,
  maxMonths = 600,
) {
  if (currentSaved >= target) return 0;
  const monthlyRate =
    annualReturn && annualReturn > 0
      ? Math.pow(1 + annualReturn, 1 / 12) - 1
      : 0;
  if (monthlyRate === 0) {
    if (!monthlyContribution || monthlyContribution <= 0) return Infinity;
    return Math.ceil((target - currentSaved) / monthlyContribution);
  }

  let months = 0;
  let balance = currentSaved;
  while (balance < target && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + (monthlyContribution || 0);
    months++;
  }

  return months >= maxMonths ? Infinity : months;
}

export function estimateGoalETA(goal: Goal) {
  const months = monthsToTarget(
    goal.currentSaved ?? 0,
    goal.monthlyContribution ?? 0,
    goal.expectedAnnualReturn ?? 0,
    goal.targetAmount,
  );
  if (!isFinite(months)) return { months: Infinity, projectedDate: null };
  const projected = new Date();
  projected.setMonth(projected.getMonth() + months);
  return { months, projectedDate: projected.toISOString() };
}
