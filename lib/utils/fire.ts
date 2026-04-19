import type {
  FireProjectionBreakdownRow,
  FireScenario,
  FireProjectionRow,
  FireSummary,
  RetirementEntry,
} from "@/lib/types/types";

/** Returns `annualExpenses / withdrawalRate`, or 0 when the rate is non-positive. */
export function calculateFireNumber(
  annualExpenses: number,
  withdrawalRate: number,
): number {
  if (withdrawalRate <= 0) return 0;
  return annualExpenses / withdrawalRate;
}

const fireDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a FIRE target date in a timezone-stable way for SSR + hydration. */
export function formatFireDateLabel(fireDate: string | null): string {
  if (!fireDate) return "—";
  return fireDateFormatter.format(new Date(fireDate));
}

/** Runs a month-by-month simulation and returns yearly projection rows + summary. */
export function generateProjection(
  scenario: FireScenario,
  options?: { startYear?: number },
): {
  rows: FireProjectionRow[];
  summary: FireSummary;
} {
  const {
    currentBalance,
    monthlyContribution,
    annualReturnRate,
    annualInflationRate,
    annualExpenses,
    withdrawalRate,
    targetFireNumber,
    projectionYears,
  } = scenario;

  const baseFireNumber =
    targetFireNumber != null && targetFireNumber > 0
      ? targetFireNumber
      : calculateFireNumber(annualExpenses, withdrawalRate);

  const monthlyRate =
    annualReturnRate > 0 ? Math.pow(1 + annualReturnRate, 1 / 12) - 1 : 0;

  const rows: FireProjectionRow[] = [];
  const startYear = options?.startYear ?? new Date().getUTCFullYear();

  let balance = currentBalance;
  let totalContributions = 0;
  let firstFireYear: number | null = null;

  for (let year = 0; year < projectionYears; year++) {
    const startBalance = balance;
    let yearContributions = 0;

    // Month-by-month simulation for this year
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      yearContributions += monthlyContribution;
    }

    totalContributions += yearContributions;
    const growth = balance - startBalance - yearContributions;
    const inflationFactor = Math.pow(1 + annualInflationRate, year);
    const fireNumber = baseFireNumber * inflationFactor;
    const isFIREd = balance >= fireNumber;

    if (isFIREd && firstFireYear === null) {
      firstFireYear = year;
    }

    rows.push({
      year,
      calendarYear: startYear + year,
      startBalance,
      contributions: yearContributions,
      growth,
      endBalance: balance,
      endBalanceReal: inflationFactor > 0 ? balance / inflationFactor : balance,
      fireNumber,
      fireNumberReal: baseFireNumber,
      isFIREd,
    });
  }

  const lastRow = rows[rows.length - 1];

  const summary: FireSummary = {
    fireNumber: baseFireNumber,
    yearsToFire: firstFireYear,
    fireDate:
      firstFireYear !== null
        ? new Date(Date.UTC(startYear + firstFireYear, 0, 1)).toISOString()
        : null,
    totalContributions,
    finalBalance: lastRow?.endBalance ?? currentBalance,
    finalBalanceReal: lastRow?.endBalanceReal ?? currentBalance,
  };

  return { rows, summary };
}

interface BuildProjectionBreakdownRowsOptions {
  historicalEstimatedRows?: FireProjectionRow[];
  futureProjectedRows: FireProjectionRow[];
  retirementEntries: RetirementEntry[];
}

/** Combines past estimated rows, current/future projections, and recorded actuals. */
export function buildProjectionBreakdownRows({
  historicalEstimatedRows = [],
  futureProjectedRows,
  retirementEntries,
}: BuildProjectionBreakdownRowsOptions): FireProjectionBreakdownRow[] {
  const actualEndByYear = new Map(
    retirementEntries.map((entry) => [entry.year, entry.endAmount]),
  );

  const mapRow = (
    row: FireProjectionRow,
    rowType: FireProjectionBreakdownRow["rowType"],
  ): FireProjectionBreakdownRow => {
    const actualEndBalance = actualEndByYear.get(row.calendarYear) ?? null;

    return {
      rowType,
      calendarYear: row.calendarYear,
      startBalance: row.startBalance,
      contributions:
        rowType === "historical-estimate" && actualEndBalance !== null
          ? null
          : row.contributions,
      growth:
        rowType === "historical-estimate" && actualEndBalance !== null
          ? null
          : row.growth,
      endBalance: row.endBalance,
      endBalanceReal: row.endBalanceReal,
      actualEndBalance,
      fireNumber: row.fireNumber,
      isFIREd: row.isFIREd,
    };
  };

  return [
    ...historicalEstimatedRows.map((row) => mapRow(row, "historical-estimate")),
    ...futureProjectedRows.map((row) => mapRow(row, "projection")),
  ];
}
