// Note 1: All aggregation and filtering logic lives here so it can be reused by
// both the API layer (server-side) and optionally in-browser without re-fetching.
// Pure functions with no side effects are easy to unit test and reason about.
import {
  CategoryType,
  Transaction,
  FilterParams,
  ReportsAggregates,
  TimeseriesPoint,
} from "./types";

// Note 1a: Historical data can contain legacy plural labels such as "Wants" or
// "Savings". Normalizing them here keeps summary cards and charts stable even if
// older records were stored before the stricter UI/category validation existed.
function normalizeReportCategory(raw: string): CategoryType {
  const value = raw.trim().toLowerCase();
  if (value === "need" || value === "needs") return "Need";
  if (value === "saving" || value === "savings") return "Saving";
  return "Want";
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

  // Note 7: Pre-initializing the object with zeroes avoids a conditional inside
  // the loop and ensures the keys are always present even if no transactions
  // exist for a given category.
  const totalByCategoryType = { Need: 0, Want: 0, Saving: 0 };
  for (const t of transactions) {
    const category = normalizeReportCategory(t.category);
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
      tsMap[period] = { period, amount: 0, Need: 0, Want: 0, Saving: 0 };
    }
    const category = normalizeReportCategory(t.category);
    tsMap[period].amount += t.amount;
    tsMap[period][category] += t.amount;
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
