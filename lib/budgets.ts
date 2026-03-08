// Note 1: BudgetAllocation and Budget are plain data types (not classes) used to
// represent a budget plan. Keeping them in a separate file from the DynamoDB layer
// allows them to be imported by both server code (API routes) and client components.
export type BudgetAllocation = { category: string; amount: number };
export type Budget = {
  budgetId?: string;
  name: string;
  allocations: BudgetAllocation[];
};

/**
 * Note 2: Converts a Budget object into a Sankey diagram data structure.
 * A Sankey diagram shows flow from a source to multiple targets. Here the single
 * source is "Budget" and each allocation category is a target node, with the
 * allocated dollar amount as the flow value.
 *
 * The resulting `{ nodes, links }` shape is compatible with the @nivo/sankey and
 * the SankeyData interface defined in lib/types.ts.
 */
export function budgetToSankey(budget: Budget) {
  // Note 3: The source node "Budget" must appear first in the nodes array so
  // Sankey chart libraries can identify it as the root of the diagram.
  // Simple conversion: one source node 'Budget' flows to category nodes
  const nodes = [
    { id: "Budget" },
    ...budget.allocations.map((a) => ({ id: a.category })),
  ];
  const links = budget.allocations.map((a) => ({
    source: "Budget",
    target: a.category,
    value: a.amount,
  }));
  return { nodes, links };
}
