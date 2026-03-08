export type BudgetAllocation = { category: string; amount: number };
export type Budget = { budgetId?: string; name: string; allocations: BudgetAllocation[] };

export function budgetToSankey(budget: Budget) {
  // Simple conversion: one source node 'Budget' flows to category nodes
  const nodes = [{ id: 'Budget' }, ...budget.allocations.map((a) => ({ id: a.category }))];
  const links = budget.allocations.map((a) => ({ source: 'Budget', target: a.category, value: a.amount }));
  return { nodes, links };
}
