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

// Note 6: FilterParams is used by the aggregations layer and the reports API to
// express which subset of transactions the user wants to view. `null` means the
// filter is not active; an empty string/array means "match all".
export interface FilterParams {
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  search: string;
}

// Note 7: A time-series groups financial data by month so charts can plot how
// spending changed over time. Each TimeseriesPoint carries the totals broken down
// by category, enabling stacked bar or area charts.
export interface TimeseriesPoint {
  period: string; // YYYY-MM
  amount: number;
  Need: number;
  Want: number;
  Saving: number;
}

// Note 8: TagDataPoint is the minimal shape required by chart libraries (e.g.
// Recharts PieChart) that expect a `name`/`value` pair for each data slice.
export interface TagDataPoint {
  name: string;
  value: number;
}

// Note 9: ReportsAggregates bundles all pre-computed summary statistics that the
// reports page needs. Returning them together in one API call avoids multiple
// round trips and keeps the frontend logic simple.
export interface ReportsAggregates {
  totalAmount: number;
  totalByCategoryType: { Need: number; Want: number; Saving: number };
  timeseries: TimeseriesPoint[];
  tagDiagramData: TagDataPoint[];
}

// Note 10: ReportsResponse is the full payload returned by GET /api/reports.
// Wrapping transactions + metadata in one typed object makes the API contract
// explicit and is easy to validate with tools like Zod.
export interface ReportsResponse {
  transactions: Transaction[];
  totalCount: number;
  aggregates: ReportsAggregates;
}

// Note 11: The Sankey diagram represents money flowing from a source (income)
// to target nodes (expense categories). Each node must have a unique `id` string,
// and each link records the flow amount between two node ids.
export interface SankeyNode {
  id: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

// Note 12: SankeyData is the exact shape required by the @nivo/sankey chart
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

// Note 13: SankeyRequestBody is validated on the server with Zod before use.
// Defining the interface separately from the Zod schema still helps TypeScript
// callers on the client side get autocompletion when building the request payload.
export interface SankeyRequestBody {
  monthlyIncome: number;
  incomeLabel: string;
  allocations: SankeyAllocation[];
}

// Note 14: `Record<string, number>` is a TypeScript utility type equivalent to
// { [key: string]: number }. It is used here to hold a flexible dictionary of
// category names mapped to their suggested dollar amounts.
export interface SankeyResponse {
  sankeyData: SankeyData;
  budgetSuggestion: Record<string, number>;
}
