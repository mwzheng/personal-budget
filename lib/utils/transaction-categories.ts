import type { CategoryType, TransactionCategoryType } from "@/lib/types/types";

export const EXPENSE_CATEGORY_OPTIONS: readonly CategoryType[] = [
  "Need",
  "Want",
  "Saving",
] as const;

export const TRANSACTION_CATEGORY_OPTIONS: readonly TransactionCategoryType[] =
  [...EXPENSE_CATEGORY_OPTIONS, "Income"] as const;

export function isExpenseCategory(value: string): value is CategoryType {
  return EXPENSE_CATEGORY_OPTIONS.includes(value as CategoryType);
}

export function isTransactionCategory(
  value: string,
): value is TransactionCategoryType {
  return TRANSACTION_CATEGORY_OPTIONS.includes(
    value as TransactionCategoryType,
  );
}

export function normalizeTransactionCategory(
  raw: string | null | undefined,
): TransactionCategoryType {
  const value = raw?.trim().toLowerCase() ?? "";
  if (value === "need" || value === "needs") return "Need";
  if (value === "saving" || value === "savings") return "Saving";
  if (value === "income") return "Income";
  return "Want";
}

export function parseTransactionCategoryFilters(
  raw: string | null,
): TransactionCategoryType[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .map((value): TransactionCategoryType | null => {
      if (value === "need") return "Need";
      if (value === "want") return "Want";
      if (value === "saving") return "Saving";
      if (value === "income") return "Income";
      return null;
    })
    .filter((value): value is TransactionCategoryType => value !== null)
    .filter(
      (value, index, values) =>
        values.findIndex((item) => item === value) === index,
    );
}
