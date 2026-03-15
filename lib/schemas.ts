// Note: Shared Zod schemas for server APIs. Centralising schemas reduces
// duplication and ensures consistent validation across route handlers.
import { z } from "zod";

export const AllocationRecord = z.record(z.number());
export const AllocationObject = z.object({
  category: z.string(),
  amount: z.number(),
});
export const AllocationArray = z.array(AllocationObject);
export const CategoryTypeSchema = z.enum(["Want", "Need", "Saving"]);
export const BudgetExpenseSchema = z.object({
  expenseId: z.string().optional(),
  name: z.string().min(1),
  amount: z.number().positive(),
  category: CategoryTypeSchema,
  group: z.string().optional(),
});

export const BudgetSchema = z.object({
  id: z.string().optional(),
  budgetId: z.string().optional(),
  name: z.string().min(1),
  monthlyIncome: z.number().positive().optional(),
  expenses: z.array(BudgetExpenseSchema).optional(),
  // Accept either the legacy record shape or the preferred array shape.
  allocations: z.union([AllocationRecord, AllocationArray]).optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Budget = z.infer<typeof BudgetSchema>;
