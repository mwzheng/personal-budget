import type { FireProjectionRow } from "@/lib/types/types";

export type FireDashboardStatus =
  "reached" | "projected" | "unreachable" | "no-target";

export interface FireMilestoneProgress {
  percentage: 25 | 50 | 75 | 100;
  amount: number;
  progress: number;
  reached: boolean;
}

/** Returns progress toward the target, clamped to the inclusive [0, 1] range. */
export function getFireProgress(
  currentBalance: number,
  target: number,
): number {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, currentBalance / target));
}

/** Returns the amount still needed to reach the target. */
export function getFireRemaining(
  currentBalance: number,
  target: number,
): number {
  return Math.max(0, target - currentBalance);
}

/** Returns the first projected row that reaches its inflation-adjusted target. */
export function getFirstFireRow(
  rows: readonly FireProjectionRow[],
): FireProjectionRow | null {
  return rows.find((row) => row.isFIREd) ?? null;
}

/** Returns the projected balance on the first FIRE row, or null when not reached. */
export function getProjectedBalanceAtFire(
  rows: readonly FireProjectionRow[],
): number | null {
  return getFirstFireRow(rows)?.endBalance ?? null;
}

/** Returns target-relative milestone progress for the 25/50/75/100% markers. */
export function getFireMilestoneProgress(
  currentBalance: number,
  target: number,
): FireMilestoneProgress[] {
  const percentages = [25, 50, 75, 100] as const;
  if (target <= 0) {
    return percentages.map((percentage) => ({
      percentage,
      amount: 0,
      progress: 0,
      reached: false,
    }));
  }

  return percentages.map((percentage) => {
    const amount = target * (percentage / 100);
    const progress = getFireProgress(currentBalance, amount);
    return { percentage, amount, progress, reached: currentBalance >= amount };
  });
}

/** Describes whether the current balance has reached, can reach, or cannot reach the target. */
export function getFireStatus(
  currentBalance: number,
  target: number,
  rows: readonly FireProjectionRow[],
): FireDashboardStatus {
  if (target <= 0) return "no-target";
  if (currentBalance >= target) return "reached";
  return getFirstFireRow(rows) ? "projected" : "unreachable";
}
