// Note 1: This file is the single source of truth for all shared TypeScript types
// and interfaces used across both the frontend and backend of the app.
// Centralizing types here prevents duplication and keeps data contracts explicit.

// Note 2: Budget and expense-allocation flows still use only the three spending
// buckets below. Reports transactions widen this with a separate
// `TransactionCategoryType` so income can be added without leaking into budget
// editors or Sankey allocations.
export type CategoryType = "Want" | "Need" | "Saving";
export type TransactionCategoryType = CategoryType | "Income";

// Note 3: An `interface` describes the shape of an object. Unlike a `class`, it
// has no runtime representation -- it is erased during compilation to JavaScript.
// Use interfaces for data transfer objects (DTOs) and plain data shapes.
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  // Note 4: Reports transactions can now represent income as well as spending and
  // savings movements, so the transaction union is wider than the budget one.
  category: TransactionCategoryType;
  date: string; // ISO YYYY-MM-DD
  notes: string;
  paymentMethod: string;
  // Note 5: `string[]` is TypeScript's array syntax. It is equivalent to
  // `Array<string>`. Tags are stored as an array, allowing a single transaction
  // to belong to multiple categories like "groceries" and "household".
  tags: string[];
  // Note 5b: createdAt/updatedAt are DynamoDB metadata fields stored with every
  // item. They are optional on the TypeScript type because older records may not
  // carry them, and the client-side form state does not need to track them.
  createdAt?: string;
  updatedAt?: string;
}

// Note 6: SalaryEntry represents one stored salary record. `yoy` is optional
// because the GET route computes it for charting, but create/update responses do
// not necessarily echo that derived field back.
export interface SalaryEntry {
  entryId: string;
  year: number;
  amount: number;
  note?: string;
  yoy?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Note 7: RetirementEntry keeps the raw yearly balances plus optional derived
// fields (`change`, `pct`) that the retirement API enriches for list rendering.
// `createdAt`/`updatedAt` are optional for parity with the persisted Dynamo rows.
export interface RetirementEntry {
  entryId: string;
  year: number;
  startAmount: number;
  endAmount: number;
  change?: number;
  pct?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Note 8: MilestoneEntry supports either a calendar-year milestone, an age
// milestone, or both. The nullable fields let the UI represent whichever anchor
// the user provided without inventing placeholder values.
export interface MilestoneEntry {
  milestoneId: string;
  amount: number;
  year: number | null;
  age?: number | null;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Note 8b: Progress goals are the long-term target records used by the Progress
// page and `/api/progress/goal`. The current UX supports a single unnamed goal,
// so the shared shape only includes the persisted identity and target amount.
export interface ProgressGoal {
  goalId?: string;
  targetAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

// Note 9: FilterParams is used by the aggregations layer and the reports API to
// express which subset of transactions the user wants to view. `years` models the
// quick year-picker state directly, while `startDate`/`endDate` support custom
// date ranges when the user needs something more precise.
export interface FilterParams {
  years: string[];
  startDate: string | null;
  endDate: string | null;
  categories: TransactionCategoryType[];
  tags: string[];
  search: string;
}

// Note 10: A time-series groups financial data by month so charts can plot how
// spending changed over time. Each TimeseriesPoint carries the totals broken down
// by category, enabling stacked bar or area charts.
export interface TimeseriesPoint {
  period: string; // YYYY-MM
  spendingAmount: number;
  incomeAmount: number;
  Need: number;
  Want: number;
  Saving: number;
}

// Note 11: TagDataPoint is the minimal shape required by chart libraries (e.g.
// Recharts PieChart) that expect a `name`/`value` pair for each data slice.
export interface TagDataPoint {
  name: string;
  value: number;
}

export interface ReportsCategoryTotals {
  Need: number;
  Want: number;
  Saving: number;
}

// Note 12: ReportsAggregates bundles all pre-computed summary statistics that the
// reports page needs. `spendingAmount` excludes Savings so the UI can label the
// main card as "Total Spending" without conflating it with money moved into savings.
// `incomeAmount` is tracked separately so the reports page can compare inflows and
// outflows month by month without treating income as a spending category.
export interface ReportsAggregates {
  totalAmount: number;
  spendingAmount: number;
  incomeAmount: number;
  totalByCategoryType: ReportsCategoryTotals;
  timeseries: TimeseriesPoint[];
  tagDiagramData: TagDataPoint[];
}

/** A calendar month's contribution to a yearly spending report. */
export interface YearlyReportMonth extends TimeseriesPoint {
  transactionCount: number;
  /** Distinguishes a zero-total month with activity from one with no records. */
  hasData: boolean;
}

/** Pre-computed, filter-independent data for the yearly reports section. */
export interface YearlyReport {
  year: number;
  months: YearlyReportMonth[];
  incomeAmount: number;
  spendingAmount: number;
  savingsAmount: number;
  totalByCategoryType: ReportsCategoryTotals;
  transactionCount: number;
  averageMonthlySpending: number;
  /** Percentage of income saved, or null when there is no income. */
  savingsRate: number | null;
  highestSpendMonth: YearlyReportMonth | null;
  largestPurchase: Transaction | null;
  topTags: TagDataPoint[];
}

// Note 12b: MonthSummary captures a single month's financial snapshot for use in
// side-by-side month comparisons. Keeping it separate from ReportsAggregates lets
// the comparison utility return a lean object focused on the metrics that matter
// when contrasting two periods.
export interface MonthSummary {
  period: string; // YYYY-MM
  totalAmount: number;
  spendingAmount: number;
  incomeAmount: number;
  totalByCategoryType: ReportsCategoryTotals;
  transactionCount: number;
  topTags: TagDataPoint[];
}

// Note 12c: MonthComparisonData bundles two MonthSummary snapshots plus the
// pre-computed percentage changes between them. Storing the deltas here avoids
// every UI consumer re-deriving the same arithmetic.
export interface MonthComparisonData {
  prevMonth: MonthSummary;
  currMonth: MonthSummary;
  changes: {
    totalAmount: number | null;
    spendingAmount: number | null;
    incomeAmount: number | null;
    Need: number | null;
    Want: number | null;
    Saving: number | null;
    transactionCount: number | null;
  };
}

// Note 13: ReportsResponse is the full payload returned by GET /api/reports.
// Wrapping transactions + metadata in one typed object makes the API contract
// explicit and is easy to validate with tools like Zod.
export interface ReportsResponse {
  transactions: Transaction[];
  totalCount: number;
  aggregates: ReportsAggregates;
}

// Note 14: BudgetAllocationEntry preserves the earlier saved-budget shape that
// stored simple `{ category, amount }` pairs. The new planner still writes it as
// a compatibility layer while the richer `expenses` array becomes the main source
// of truth for the UI.
export interface BudgetAllocationEntry {
  category: string;
  amount: number;
}

// Note 15: BudgetExpense is the row shape edited on the budget page. `group`
// stores the optional Sankey path string entered by the user, such as
// `Subscriptions > Work`, so one field can describe zero, one, or many
// intermediate Sankey branches before the final expense leaf.
export interface BudgetExpense {
  expenseId: string;
  name: string;
  amount: number;
  category: CategoryType;
  group?: string;
}

// Note 16: SavedBudget models the persisted response from the budgets API.
// `monthlyIncome` and `expenses` are optional here so the UI can still load
// older saved budgets that only contain the legacy `allocations` array.
export interface SavedBudget {
  budgetId?: string;
  name: string;
  monthlyIncome?: number;
  expenses?: BudgetExpense[];
  allocations?: BudgetAllocationEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export type SankeyNodeKind = "income" | "path" | "expense" | "balance";

// Note 17: The Sankey diagram represents money flowing from a source (income)
// into optional path nodes and then into individual expense leaves. Each node
// must have a unique `id` string, and each link records the flow amount between
// two node ids.
export interface SankeyNode {
  id: string;
  label?: string;
  color?: string;
  kind?: SankeyNodeKind;
  category?: CategoryType;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
  startColor?: string;
  endColor?: string;
  kind?: string;
}

// Note 18: SankeyData is the exact shape required by the @nivo/sankey chart
// library. Keeping this interface here rather than in the component file allows
// the API route to return correctly typed data without importing UI dependencies.
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyAllocation {
  category: CategoryType;
  percentage: number;
}

// Note 19: SankeyRequestBody is validated on the server with Zod before use.
// Defining the interface separately from the Zod schema still helps TypeScript
// callers on the client side get autocompletion when building the request payload.
export interface SankeyRequestBody {
  monthlyIncome: number;
  incomeLabel: string;
  allocations: SankeyAllocation[];
}

// Note 20: `Record<string, number>` is a TypeScript utility type equivalent to
// { [key: string]: number }. It is used here to hold a flexible dictionary of
// category names mapped to their suggested dollar amounts.
export interface SankeyResponse {
  sankeyData: SankeyData;
  budgetSuggestion: Record<string, number>;
}

// ---------------------------------------------------------------------------
// FIRE (Financial Independence, Retire Early) calculator types
// ---------------------------------------------------------------------------

// Note 21: FireScenario stores the user-provided inputs for a FIRE projection.
// Only the inputs are persisted to DynamoDB; projection rows are computed
// client-side in real-time for instant feedback as the user adjusts sliders.
export interface FireScenario {
  scenarioId?: string;
  name: string;
  currentBalance: number;
  monthlyContribution: number;
  annualReturnRate: number; // decimal, e.g. 0.07 = 7%
  annualInflationRate: number; // decimal, e.g. 0.03 = 3%
  annualExpenses: number;
  withdrawalRate: number; // decimal, e.g. 0.04 = 4%
  targetFireNumber?: number | null; // auto-calculated if null/undefined
  projectionYears: number;
  createdAt?: string;
  updatedAt?: string;
}

// Note 22: Each row represents one year in the projection table/chart.
// Both nominal and inflation-adjusted (real) values are stored so the UI
// can toggle between views or overlay them on the same chart.
export interface FireProjectionRow {
  year: number; // 0-based index (0 = current year)
  calendarYear: number;
  startBalance: number;
  contributions: number;
  growth: number;
  endBalance: number;
  endBalanceReal: number; // inflation-adjusted
  fireNumber: number; // nominal target (grows with inflation)
  fireNumberReal: number; // constant real target
  isFIREd: boolean;
}

// Note 22b: The breakdown table can prepend historical retirement entries ahead
// of the projected rows so the timeline starts at the user's first submitted
// year. Historical rows leave unknown projected-only fields as `null`.
export interface FireProjectionBreakdownRow {
  rowType: "historical-estimate" | "projection";
  calendarYear: number;
  startBalance: number;
  contributions: number | null;
  growth: number | null;
  endBalance: number;
  endBalanceReal: number | null;
  actualEndBalance: number | null;
  fireNumber: number | null;
  isFIREd: boolean;
}

// Note 23: FireSummary provides the headline metrics displayed in the
// summary card above the chart. `yearsToFire` is null when the target
// is unreachable within the projection window.
export interface FireSummary {
  fireNumber: number;
  yearsToFire: number | null;
  fireDate: string | null;
  totalContributions: number;
  finalBalance: number;
  finalBalanceReal: number;
}
