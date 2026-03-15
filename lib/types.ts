// Note 1: This file is the single source of truth for all shared TypeScript types
// and interfaces used across both the frontend and backend of the app.
// Centralizing types here prevents duplication and keeps data contracts explicit.

// Note 2: A TypeScript union type restricts a variable to a fixed set of string
// literals. Using "Want" | "Need" | "Saving" instead of plain `string` means the
// compiler will catch typos (e.g., "want") at build time rather than at runtime.
export type CategoryType = "Want" | "Need" | "Saving";

// Note 3: An `interface` describes the shape of an object. Unlike a `class`, it
// has no runtime representation -- it is erased during compilation to JavaScript.
// Use interfaces for data transfer objects (DTOs) and plain data shapes.
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  // Note 4: CategoryType here reuses the union defined above. TypeScript will
  // enforce that only "Want", "Need", or "Saving" can be assigned to this field.
  category: CategoryType;
  date: string; // ISO YYYY-MM-DD
  notes: string;
  paymentMethod: string;
  // Note 5: `string[]` is TypeScript's array syntax. It is equivalent to
  // `Array<string>`. Tags are stored as an array, allowing a single transaction
  // to belong to multiple categories like "groceries" and "household".
  tags: string[];
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
}

// Note 7: RetirementEntry keeps the raw yearly balances plus optional derived
// fields (`change`, `pct`) that the retirement API enriches for list rendering.
export interface RetirementEntry {
  entryId: string;
  year: number;
  startAmount: number;
  endAmount: number;
  change?: number;
  pct?: number | null;
}

// Note 8: MilestoneEntry supports either a calendar-year milestone, an age
// milestone, or both. The nullable fields let the UI represent whichever anchor
// the user provided without inventing placeholder values.
export interface MilestoneEntry {
  milestoneId: string;
  amount: number;
  year: number | null;
  age: number | null;
}

// Note 9: FilterParams is used by the aggregations layer and the reports API to
// express which subset of transactions the user wants to view. `years` models the
// quick year-picker state directly, while `startDate`/`endDate` support custom
// date ranges when the user needs something more precise.
export interface FilterParams {
  years: string[];
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  search: string;
}

// Note 10: A time-series groups financial data by month so charts can plot how
// spending changed over time. Each TimeseriesPoint carries the totals broken down
// by category, enabling stacked bar or area charts.
export interface TimeseriesPoint {
  period: string; // YYYY-MM
  amount: number;
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

// Note 12: ReportsAggregates bundles all pre-computed summary statistics that the
// reports page needs. `spendingAmount` excludes Savings so the UI can label the
// main card as "Total Spending" without conflating it with money moved into savings.
export interface ReportsAggregates {
  totalAmount: number;
  spendingAmount: number;
  totalByCategoryType: { Need: number; Want: number; Saving: number };
  timeseries: TimeseriesPoint[];
  tagDiagramData: TagDataPoint[];
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
