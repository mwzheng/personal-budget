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

// Note 2: Contact form strings are trimmed at validation time so the client and
// API both reject whitespace-only submissions without duplicating cleanup logic.
export const ContactSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(80, "Name must be 80 characters or fewer.")
    .refine((value) => !/[\r\n]/.test(value), "Name must stay on one line."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(254, "Email must be 254 characters or fewer.")
    .email("Enter a valid email address."),
  subject: z
    .string()
    .trim()
    .min(1, "Please enter a subject.")
    .max(120, "Subject must be 120 characters or fewer.")
    .refine((value) => !/[\r\n]/.test(value), "Subject must stay on one line."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message must be 2000 characters or fewer."),
});

// Milestones historically accepted year-only and age-only records. Keep that
// API compatibility while requiring a year whenever an exact calendar month is
// supplied; the form enforces month/year for new interactive entries.
const MilestoneFieldsSchema = z.object({
  amount: z.number().finite().positive(),
  year: z.number().int().min(1).max(9999).nullable().optional(),
  month: z.number().int().min(1).max(12).nullable().optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  note: z.string().trim().max(500).optional(),
});

function requireYearForMonth(
  value: { year?: number | null; month?: number | null },
  ctx: z.RefinementCtx,
) {
  if (
    value.month !== null &&
    value.month !== undefined &&
    typeof value.year !== "number"
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["year"],
      message: "Year is required when month is provided.",
    });
  }
}

export const MilestoneCreateSchema =
  MilestoneFieldsSchema.superRefine(requireYearForMonth);

export const MilestoneUpdateSchema = MilestoneFieldsSchema.extend({
  milestoneId: z.string().trim().min(1),
  // Null represents the legacy yearless sort key (`milestone#0#...`).
  originalYear: z.number().int().nullable(),
  // The edit form carries this forward so replacing a year-keyed item does not
  // discard its creation timestamp.
  createdAt: z.string().datetime().optional(),
}).superRefine(requireYearForMonth);

export type Budget = z.infer<typeof BudgetSchema>;
export type ContactSubmission = z.infer<typeof ContactSubmissionSchema>;
