/**
 * Note 1: DynamoDB sort-key prefix constants for the single-table design.
 *
 * The application stores multiple entity types in a single DynamoDB table,
 * distinguishing them by a prefix on the sort key (`sk`). Centralizing these
 * prefixes here eliminates magic strings scattered across data-access modules
 * and makes it easy to search, rename, or audit key usage in one place.
 *
 * Each prefix ends with `#` so it can be directly concatenated with the
 * entity-specific suffix (e.g., `SK_PREFIX.TRANSACTION + "2024-01-15#abc"`).
 */
export const SK_PREFIX = {
  /** Transactions — `date#YYYY-MM-DD#<id>` */
  TRANSACTION: "date#",
  /** Savings goals — `goal#<goalId>` */
  GOAL: "goal#",
  /** Budget plans — `budget#<budgetId>` */
  BUDGET: "budget#",
  /** Salary entries — `salary#<year>#<id>` */
  SALARY: "salary#",
  /** Retirement entries — `retirement#<year>#<id>` */
  RETIREMENT: "retirement#",
  /** Milestones — `milestone#<year>#<id>` */
  MILESTONE: "milestone#",
  /** Progress goals — `progressGoal#<goalId>` */
  PROGRESS_GOAL: "progressGoal#",
} as const;
