import {
  differenceInCalendarDays,
  format as formatDate,
  parseISO,
  subDays,
} from "date-fns";

import {
  FilterParams,
  ReportsAggregates,
  Transaction,
} from "@/lib/types/types";
import {
  getAllTags,
  getAvailableReportYears,
  resolveDefaultReportYears,
} from "@/lib/utils/aggregations";

export type TransactionsViewMode = "table" | "calendar";

export const EMPTY_AGGREGATES: ReportsAggregates = {
  totalAmount: 0,
  spendingAmount: 0,
  incomeAmount: 0,
  totalByCategoryType: { Need: 0, Want: 0, Saving: 0 },
  timeseries: [],
  tagDiagramData: [],
};

export const EMPTY_FILTERS: FilterParams = {
  years: [],
  startDate: null,
  endDate: null,
  categories: [],
  tags: [],
  search: "",
};

export const PAGE_TITLE_ID = "reports-page-title";
export const PAGE_DESCRIPTION_ID = "reports-page-description";

export function buildYearFilters(years: string[]): FilterParams {
  return {
    ...EMPTY_FILTERS,
    years,
  };
}

/**
 * Resolves report filters after transaction data is available. A valid complete
 * preference (including an intentionally empty one) wins over the legacy year
 * preference; only data-dependent years and tags are pruned.
 */
export function initializeReportFilters(
  transactions: Transaction[],
  storedFilters: FilterParams | null,
  legacyYears: string[],
): FilterParams {
  if (storedFilters) {
    const availableYears = new Set(getAvailableReportYears(transactions));
    const availableTags = new Set(getAllTags(transactions));
    const restoredYears = storedFilters.years.filter((year) =>
      availableYears.has(year),
    );
    const years =
      storedFilters.years.length > 0 && restoredYears.length === 0
        ? resolveDefaultReportYears(transactions, [])
        : restoredYears;

    return {
      ...storedFilters,
      years,
      tags: storedFilters.tags.filter((tag) => availableTags.has(tag)),
    };
  }

  return buildYearFilters(resolveDefaultReportYears(transactions, legacyYears));
}

export function buildQuickTagFilters(
  currentFilters: FilterParams,
  tag: string,
): FilterParams {
  const nextTags =
    currentFilters.tags.length === 1 && currentFilters.tags[0] === tag
      ? []
      : [tag];

  return { ...currentFilters, tags: nextTags };
}

export function buildComparablePeriodFilters(
  filters: FilterParams,
): FilterParams | null {
  if (filters.startDate && filters.endDate) {
    const startDate = parseISO(filters.startDate);
    const endDate = parseISO(filters.endDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate < startDate
    ) {
      return null;
    }

    const rangeDays = differenceInCalendarDays(endDate, startDate) + 1;
    const previousEndDate = subDays(startDate, 1);
    const previousStartDate = subDays(previousEndDate, rangeDays - 1);

    return {
      ...filters,
      years: [],
      startDate: formatDate(previousStartDate, "yyyy-MM-dd"),
      endDate: formatDate(previousEndDate, "yyyy-MM-dd"),
    };
  }

  if (filters.years.length === 0) {
    return null;
  }

  const sortedYears = Array.from(
    new Set(
      filters.years
        .map((year) => Number.parseInt(year, 10))
        .filter((year) => Number.isInteger(year)),
    ),
  ).sort((a, b) => a - b);

  if (sortedYears.length !== filters.years.length) {
    return null;
  }

  for (let index = 1; index < sortedYears.length; index += 1) {
    if (sortedYears[index] !== sortedYears[index - 1] + 1) {
      return null;
    }
  }

  const previousYears = Array.from({ length: sortedYears.length }, (_, index) =>
    String(sortedYears[0] - sortedYears.length + index),
  );

  return {
    ...filters,
    years: previousYears,
    startDate: null,
    endDate: null,
  };
}

export function buildStatTrend(
  currentValue: number,
  previousValue: number,
  positiveIsFavorable: boolean,
) {
  if (previousValue === 0) {
    return {
      direction: null,
      text:
        currentValue === 0
          ? "No change vs previous period"
          : "New vs previous period",
      color: "text.secondary",
    } as const;
  }

  const delta =
    ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  if (delta === 0) {
    return {
      direction: null,
      text: "No change vs previous period",
      color: "text.secondary",
    } as const;
  }

  const isIncrease = delta > 0;
  const isFavorable = positiveIsFavorable ? isIncrease : !isIncrease;

  return {
    direction: isIncrease ? "up" : "down",
    text: `${Math.abs(delta).toFixed(1)}% vs previous period`,
    color: isFavorable ? "success.main" : "error.main",
  } as const;
}
