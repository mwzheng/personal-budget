export type CategoryType = 'Want' | 'Need' | 'Saving';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: CategoryType;
  date: string; // ISO YYYY-MM-DD
  notes: string;
  paymentMethod: string;
  tags: string[];
}

export interface FilterParams {
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  search: string;
}

export interface TimeseriesPoint {
  period: string; // YYYY-MM
  amount: number;
  Need: number;
  Want: number;
  Saving: number;
}

export interface TagDataPoint {
  name: string;
  value: number;
}

export interface ReportsAggregates {
  totalAmount: number;
  totalByCategoryType: { Need: number; Want: number; Saving: number };
  timeseries: TimeseriesPoint[];
  tagDiagramData: TagDataPoint[];
}

export interface ReportsResponse {
  transactions: Transaction[];
  totalCount: number;
  aggregates: ReportsAggregates;
}

export interface SankeyNode {
  id: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyAllocation {
  category: CategoryType;
  percentage: number;
}

export interface SankeyRequestBody {
  monthlyIncome: number;
  incomeLabel: string;
  allocations: SankeyAllocation[];
}

export interface SankeyResponse {
  sankeyData: SankeyData;
  budgetSuggestion: Record<string, number>;
}
