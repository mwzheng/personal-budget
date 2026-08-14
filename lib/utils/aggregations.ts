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
import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import { normalizeTransactionCategory } from "./transaction-categories";

export type ReportDateRangePreset =
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "last-quarter"
  | "this-year"
  | "last-year"
  | "last-90-days"
  | "all-time"
  | "custom";

const DATE_FORMAT = "yyyy-MM-dd";

function toFilterDateRange(startDate: Date, endDate: Date) {
  return {
    startDate: format(startDate, DATE_FORMAT),
    endDate: format(endDate, DATE_FORMAT),
  };
}

/** Returns local-calendar report ranges for the quick filter controls. */
export function getReportDateRangePreset(
  preset: ReportDateRangePreset,
  referenceDate: Date = new Date(),
): Pick<FilterParams, "startDate" | "endDate"> {
  switch (preset) {
    case "this-month":
      return toFilterDateRange(
        startOfMonth(referenceDate),
        endOfMonth(referenceDate),
      );
    case "last-month": {
      const lastMonth = subMonths(referenceDate, 1);
      return toFilterDateRange(startOfMonth(lastMonth), endOfMonth(lastMonth));
    }
    case "this-quarter":
      return toFilterDateRange(
        startOfQuarter(referenceDate),
        endOfQuarter(referenceDate),
      );
    case "last-quarter": {
      const lastQuarter = subQuarters(referenceDate, 1);
      return toFilterDateRange(
        startOfQuarter(lastQuarter),
        endOfQuarter(lastQuarter),
      );
    }
    case "this-year":
      return toFilterDateRange(
        startOfYear(referenceDate),
        endOfYear(referenceDate),
      );
    case "last-year": {
      const lastYear = subYears(referenceDate, 1);
      return toFilterDateRange(startOfYear(lastYear), endOfYear(lastYear));
    }
    case "last-90-days":
      return toFilterDateRange(subDays(referenceDate, 89), referenceDate);
    case "all-time":
    case "custom":
      return { startDate: null, endDate: null };
  }
}

function createEmptyCategoryTotals(): ReportsCategoryTotals {
  return { Need: 0, Want: 0, Saving: 0 };
}

function isIncomeTransaction(transaction: Transaction): boolean {
  return normalizeTransactionCategory(transaction.category) === "Income";
}

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

    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => t.tags.includes(tag))
    )
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();

      const matches =
        t.name.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));

      if (!matches) return false;
    }

    return true;
  });
}

export function aggregateTransactions(
  transactions: Transaction[],
): ReportsAggregates {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  let incomeAmount = 0;

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

  const timeseries = Object.values(tsMap).sort((a, b) =>
    a.period.localeCompare(b.period),
  );

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

export function getAllTags(transactions: Transaction[]): string[] {
  const set = new Set<string>();

  for (const t of transactions) {
    for (const tag of t.tags) set.add(tag);
  }

  return Array.from(set).sort();
}

export function getAvailableReportYears(transactions: Transaction[]): string[] {
  const years = new Set<string>();

  for (const transaction of transactions) {
    years.add(transaction.date.substring(0, 4));
  }

  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

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

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    set.add(t.date.substring(0, 7));
  }
  return Array.from(set).sort();
}

export function getMonthTransactions(
  transactions: Transaction[],
  period: string,
): Transaction[] {
  return transactions.filter((t) => t.date.substring(0, 7) === period);
}

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
 * Ranks tags shown in a month comparison by their combined spend.
 */
export function rankComparisonTags(
  prevMonthTags: TagDataPoint[],
  currMonthTags: TagDataPoint[],
): string[] {
  const combinedValues = new Map<string, number>();

  for (const tag of [...prevMonthTags, ...currMonthTags]) {
    combinedValues.set(
      tag.name,
      (combinedValues.get(tag.name) ?? 0) + tag.value,
    );
  }

  return Array.from(combinedValues.entries())
    .sort(([nameA, valueA], [nameB, valueB]) => {
      return valueB - valueA || nameA.localeCompare(nameB);
    })
    .map(([name]) => name);
}

function pctChange(oldVal: number, newVal: number): number | null {
  if (oldVal === 0) return newVal === 0 ? 0 : null;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
}

export function buildMonthComparison(
  transactions: Transaction[],
  periodA: string,
  periodB: string,
): MonthComparisonData {
  const prevMonth = buildMonthSummary(transactions, periodA);
  const currMonth = buildMonthSummary(transactions, periodB);

  return {
    prevMonth,
    currMonth,
    changes: {
      totalAmount: pctChange(prevMonth.totalAmount, currMonth.totalAmount),
      spendingAmount: pctChange(
        prevMonth.spendingAmount,
        currMonth.spendingAmount,
      ),
      incomeAmount: pctChange(prevMonth.incomeAmount, currMonth.incomeAmount),
      Need: pctChange(
        prevMonth.totalByCategoryType.Need,
        currMonth.totalByCategoryType.Need,
      ),
      Want: pctChange(
        prevMonth.totalByCategoryType.Want,
        currMonth.totalByCategoryType.Want,
      ),
      Saving: pctChange(
        prevMonth.totalByCategoryType.Saving,
        currMonth.totalByCategoryType.Saving,
      ),
      transactionCount: pctChange(
        prevMonth.transactionCount,
        currMonth.transactionCount,
      ),
    },
  };
}

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
