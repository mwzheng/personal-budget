import { Transaction, FilterParams, ReportsAggregates, TimeseriesPoint } from './types';

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterParams,
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
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

export function aggregateTransactions(transactions: Transaction[]): ReportsAggregates {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const totalByCategoryType = { Need: 0, Want: 0, Saving: 0 };
  for (const t of transactions) {
    totalByCategoryType[t.category] += t.amount;
  }

  // Monthly time series
  const tsMap: Record<string, TimeseriesPoint> = {};
  for (const t of transactions) {
    const period = t.date.substring(0, 7); // YYYY-MM
    if (!tsMap[period]) {
      tsMap[period] = { period, amount: 0, Need: 0, Want: 0, Saving: 0 };
    }
    tsMap[period].amount += t.amount;
    tsMap[period][t.category] += t.amount;
  }
  const timeseries = Object.values(tsMap).sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  // Top 15 tags by total spend
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

  return { totalAmount, totalByCategoryType, timeseries, tagDiagramData };
}

export function getAllTags(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    for (const tag of t.tags) set.add(tag);
  }
  return Array.from(set).sort();
}
