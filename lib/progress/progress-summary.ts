// Note 1: Pure helper functions for computing summary metrics on the Progress
// page. All functions are side-effect-free and receive data as arguments so
// they can be unit-tested without any DOM or React dependencies.

import type { RetirementEntry, SalaryEntry } from "@/lib/types/types";

/**
 * Returns the end-amount from the retirement entry with the highest year.
 * Returns `null` if the array is empty.
 */
export function getLatestRetirementTotal(
  entries: RetirementEntry[],
): number | null {
  if (entries.length === 0) return null;
  const latest = entries.reduce((best, entry) =>
    entry.year > best.year ? entry : best,
  );
  return latest.endAmount;
}

/**
 * Returns the salary amount from the salary entry with the highest year.
 * Returns `null` if the array is empty.
 */
export function getLatestSalary(entries: SalaryEntry[]): number | null {
  if (entries.length === 0) return null;
  const latest = entries.reduce((best, entry) =>
    entry.year > best.year ? entry : best,
  );
  return latest.amount;
}

/** Result shape returned by {@link computeGoalProgress}. */
export interface GoalProgress {
  /** Raw percentage (may exceed 100). `null` when inputs are missing. */
  rawPct: number | null;
  /** Percentage clamped to [0, 100] for progress bars. `null` when inputs are missing. */
  clampedPct: number | null;
}

/**
 * Computes the goal progress percentage from the current saved amount and the
 * target amount. The raw percentage is the unclamped value (useful for
 * displaying "105% of goal"), and the clamped percentage is bounded to [0, 100]
 * for use with determinate progress bars.
 *
 * Returns `{ rawPct: null, clampedPct: null }` if either input is missing or
 * the target amount is zero.
 */
export function computeGoalProgress(
  latestEnd: number | null,
  targetAmount: number | null,
): GoalProgress {
  if (latestEnd === null || targetAmount === null || targetAmount === 0) {
    return { rawPct: null, clampedPct: null };
  }
  const rawPct = Math.round((latestEnd / targetAmount) * 10000) / 100;
  const clampedPct = Math.min(Math.max(rawPct, 0), 100);
  return { rawPct, clampedPct };
}
