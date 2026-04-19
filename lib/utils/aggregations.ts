// Note 1: All aggregation and filtering logic lives here so it can be reused by
// both the API layer (server-side) and optionally in-browser without re-fetching.
// Pure functions with no side effects are easy to unit test and reason about.
import {
  Transaction,
  FilterParams,
  MonthComparisonData,
  MonthSummary,
  ReportsCategoryTotals,
  ReportsAggregates,
  TagDataPoint,
  TimeseriesPoint,
} from "../types/types";
import { normalizeTransactionCategory } from "./transaction-categories";

function createEmptyCategoryTotals(): ReportsCategoryTotals {
  return { Need: 0, Want: 0, Saving: 0 };
}

function isIncomeTransaction(transaction: Transaction): boolean {
  return normalizeTransactionCategory(transaction.category) === "Income";
}

/**
 * Note 2: Returns only the transactions that match every active filter.
 * Filters are ANDed together -- a transaction must pass all non-empty filters to
 * be included. The function uses `Array.filter` for a clean, declarative style.
 *
 * Date comparison uses lexicographic string ordering which works correctly for
 * ISO dates in "YYYY-MM-DD" format (alphabetical order equals chronological order).
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: FilterParams,
): Transaction[] {
  return transactions.filter((t) => {
    if (
      filters.years.length > 0 &&
      !filters.years.includes(t.date.substring(0, 4))
    ) {
      return false;
    }
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(normalizeTransactionCategory(t.category))
    ) {
      return false;
    }
    // Note 3: `Array.some` returns true if at least one of the filter tags is
    // found in the transaction's tag list. This implements OR logic for tags:
    // the transaction only needs to have ANY of the selected tags, not all of them.
    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => t.tags.includes(tag))
    )
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      // Note 4: Searching across name, notes, and tags lets users find
      // transactions by keyword without needing exact field knowledge.
      const matches =
        t.name.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });
}

/**
 * Note 5: Computes three summaries from a flat transaction array in a single pass
 * per summary: totals by category, a monthly time series, and tag spending.
 * Running multiple reduce/map loops over the same data is O(n) per loop; for the
 * typical dataset size here this is not a bottleneck but is still worth noting.
 */
export function aggregateTransactions(
  transactions: Transaction[],
): ReportsAggregates {
  // Note 6: `Array.reduce` accumulates a running sum across all transactions.
  // The initial value `0` ensures correctness for empty arrays.
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  let incomeAmount = 0;

  // Note 7: Pre-initializing the object with zeroes avoids a conditional inside
  // the loop and ensures the keys are always present even if no transactions
  // exist for a given category.
  const totalByCategoryType = createEmptyCategoryTotals();
  for (const t of transactions) {
    const category = normalizeTransactionCategory(t.category);
    if (category === "Income") {
      incomeAmount += t.amount;
      continue;
    }
    totalByCategoryType[category] += t.amount;
  }
  const spendingAmount = totalByCategoryType.Need + totalByCategoryType.Want;

  // Monthly time series
  // Note 8: A plain object is used as a hash map keyed by "YYYY-MM". This is
  // more performant than filtering the array once per month. The keys are later
  // sorted to guarantee chronological order in the output array.
  const tsMap: Record<string, TimeseriesPoint> = {};
  for (const t of transactions) {
    const period = t.date.substring(0, 7); // YYYY-MM
    if (!tsMap[period]) {
      tsMap[period] = {
        period,
        spendingAmount: 0,
        incomeAmount: 0,
        Need: 0,
        Want: 0,
        Saving: 0,
      };
    }
    const category = normalizeTransactionCategory(t.category);
    if (category === "Income") {
      tsMap[period].incomeAmount += t.amount;
      continue;
    }
    tsMap[period][category] += t.amount;
    if (category !== "Saving") {
      tsMap[period].spendingAmount += t.amount;
    }
  }
  // Note 9: `Object.values` returns the hash map values as an array.
  // `localeCompare` on the "YYYY-MM" period strings sorts them chronologically.
  const timeseries = Object.values(tsMap).sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  // Top 15 tags by total spend
  // Note 10: Tags are summed across all transactions, then sorted descending by
  // value and sliced to the top 15. Limiting to 15 keeps chart legends readable.
  const tagMap: Record<string, number> = {};
  for (const t of transactions) {
    if (isIncomeTransaction(t)) {
      continue;
    }
    for (const tag of t.tags) {
      tagMap[tag] = (tagMap[tag] || 0) + t.amount;
    }
  }
  const tagDiagramData = Object.entries(tagMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  return {
    totalAmount,
    spendingAmount,
    incomeAmount,
    totalByCategoryType,
    timeseries,
    tagDiagramData,
  };
}

/**
 * Note 11: Collects every unique tag across all transactions using a `Set`,
 * which automatically deduplicates values. Converting back to an array and
 * sorting makes the result deterministic for display in filter dropdowns.
 */
export function getAllTags(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    for (const tag of t.tags) set.add(tag);
  }
  return Array.from(set).sort();
}

/**
 * Note 12: Deriving the quick-year list from transaction dates keeps the filter
 * UI current as users import historical or future-looking data. Returning the
 * years in descending order puts the most relevant option first.
 */
export function getAvailableReportYears(transactions: Transaction[]): string[] {
  const years = new Set<string>();
  for (const transaction of transactions) {
    years.add(transaction.date.substring(0, 4));
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

/**
 * Note 13: The default-year resolver intentionally trusts a stored preference
 * only when it still exists in the available data. This prevents the reports
 * page from booting into an empty year after the underlying data changes.
 */
export function resolveDefaultReportYear(
  transactions: Transaction[],
  storedYear: string | null,
  fallbackDate: Date = new Date(),
): string {
  return resolveDefaultReportYears(
    transactions,
    storedYear ? [storedYear] : [],
    fallbackDate,
  )[0];
}

/**
 * Note 13a: Restoring multiple stored years keeps the quick-filter consistent
 * with the user's last reports view, but stale years are dropped if they no
 * longer exist in the current dataset.
 */
export function resolveDefaultReportYears(
  transactions: Transaction[],
  storedYears: string[],
  fallbackDate: Date = new Date(),
): string[] {
  const availableYears = getAvailableReportYears(transactions);
  const validStoredYears = availableYears.filter((year) =>
    storedYears.includes(year),
  );
  if (validStoredYears.length > 0) {
    return validStoredYears;
  }
  return [availableYears[0] ?? String(fallbackDate.getFullYear())];
}

/**
 * Note 14: Returning ISO date strings here keeps the year shortcut consistent
 * with the rest of the filter pipeline, which already compares dates as
 * "YYYY-MM-DD" strings.
 */
export function createYearDateRange(
  year: string,
): Pick<FilterParams, "startDate" | "endDate"> {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

// ---------------------------------------------------------------------------
// Month comparison utilities
// ---------------------------------------------------------------------------

/**
 * Returns every unique "YYYY-MM" period present in the transaction list,
 * sorted chronologically (oldest first).
 */
export function getAvailableMonths(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    set.add(t.date.substring(0, 7));
  }
  return Array.from(set).sort();
}

/**
 * Filters transactions to those belonging to a single "YYYY-MM" period.
 */
export function getMonthTransactions(
  transactions: Transaction[],
  period: string,
): Transaction[] {
  return transactions.filter((t) => t.date.substring(0, 7) === period);
}

/**
 * Builds a MonthSummary for a single month: totals, category breakdown,
 * transaction count, and top 10 tags by spend.
 */
export function buildMonthSummary(
  transactions: Transaction[],
  period: string,
): MonthSummary {
  const monthTxns = getMonthTransactions(transactions, period);
  const totalAmount = monthTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalByCategoryType = createEmptyCategoryTotals();
  let incomeAmount = 0;
  const tagMap: Record<string, number> = {};

  for (const t of monthTxns) {
    const category = normalizeTransactionCategory(t.category);
    if (category === "Income") {
      incomeAmount += t.amount;
      continue;
    }
    totalByCategoryType[category] += t.amount;
    for (const tag of t.tags) {
      tagMap[tag] = (tagMap[tag] || 0) + t.amount;
    }
  }

  const topTags: TagDataPoint[] = Object.entries(tagMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    period,
    totalAmount,
    spendingAmount: totalByCategoryType.Need + totalByCategoryType.Want,
    incomeAmount,
    totalByCategoryType,
    transactionCount: monthTxns.length,
    topTags,
  };
}

/**
 * Computes the percentage change from `oldVal` to `newVal`.
 * Returns `null` when `oldVal` is zero (division by zero).
 */
function pctChange(oldVal: number, newVal: number): number | null {
  if (oldVal === 0) return newVal === 0 ? 0 : null;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
}

/**
 * Builds a full side-by-side comparison between two month periods (A → B).
 * Changes are expressed as percentage deltas from A to B.
 */
export function buildMonthComparison(
  transactions: Transaction[],
  periodA: string,
  periodB: string,
): MonthComparisonData {
  const monthA = buildMonthSummary(transactions, periodA);
  const monthB = buildMonthSummary(transactions, periodB);

  return {
    monthA,
    monthB,
    changes: {
      totalAmount: pctChange(monthA.totalAmount, monthB.totalAmount),
      spendingAmount: pctChange(monthA.spendingAmount, monthB.spendingAmount),
      incomeAmount: pctChange(monthA.incomeAmount, monthB.incomeAmount),
      Need: pctChange(
        monthA.totalByCategoryType.Need,
        monthB.totalByCategoryType.Need,
      ),
      Want: pctChange(
        monthA.totalByCategoryType.Want,
        monthB.totalByCategoryType.Want,
      ),
      Saving: pctChange(
        monthA.totalByCategoryType.Saving,
        monthB.totalByCategoryType.Saving,
      ),
      transactionCount: pctChange(
        monthA.transactionCount,
        monthB.transactionCount,
      ),
    },
  };
}

/**
 * Returns sensible default months for the comparison modal:
 * [previousMonth, currentMonth] based on available transaction data.
 * Falls back to the two most recent months when the calendar "current" month
 * has no data.
 */
export function getDefaultComparisonMonths(
  transactions: Transaction[],
  today: Date = new Date(),
): [string, string] {
  const months = getAvailableMonths(transactions);
  if (months.length === 0) {
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed
    const curr = `${y}-${String(m + 1).padStart(2, "0")}`;
    const prev = m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, "0")}`;
    return [prev, curr];
  }
  if (months.length === 1) return [months[0], months[0]];

  // Try to find the current calendar month in available data
  const currPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currIdx = months.indexOf(currPeriod);
  if (currIdx > 0) return [months[currIdx - 1], months[currIdx]];

  // Fall back to the two most recent months with data
  return [months[months.length - 2], months[months.length - 1]];
}
