/**
 * Note 1: Data normalization and formatting utilities — the base layer of the
 * budget utility stack. No dependencies on other local budget modules, so both
 * budget-calculator and sankey-builder can safely import from here without
 * creating circular references.
 *
 * Responsibilities:
 * - Factory functions for creating typed BudgetExpense / BudgetDraft shapes
 * - Input sanitization (trim, round, coerce)
 * - Legacy-to-current data migration (allocations → expenses)
 * - Path-segment parsing for Sankey group fields
 * - Normalizing raw drafts before editor display or DynamoDB writes
 */
import {
  BudgetAllocationEntry,
  BudgetExpense,
  CategoryType,
  SavedBudget,
} from "../types/types";
import { generateId } from "./generateId";

// Note 2: BudgetDraft lives here (not in budget-calculator) so that
// normalizeBudgetForEditor can reference it without creating an import
// cycle. All other budget modules that need the type import it from here.
export interface BudgetDraft {
  budgetId?: string;
  name: string;
  monthlyIncome: number;
  expenses: BudgetExpense[];
  createdAt?: string;
  updatedAt?: string;
}

// Internal type alias — callers always pass validated BudgetExpense objects;
// this partial form is only used when normalizing unvalidated form/API input.
type BudgetExpenseInput = Partial<BudgetExpense>;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function trimText(value?: string): string {
  return (value ?? "").trim();
}

function roundCurrency(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function normalizePositiveAmount(value: number): number {
  return value > 0 ? roundCurrency(value) : 0;
}

// Note 3: Legacy budgets stored only a human-readable "category" label (e.g.
// "Rent / Needs") without a typed CategoryType discriminant. This heuristic
// maps those labels to the three canonical types so old data can be elevated
// to the richer expense model without manual migration.
function inferLegacyCategoryType(label: string): CategoryType {
  const normalized = label.trim().toLowerCase();

  if (normalized.includes("saving") || normalized.includes("save")) {
    return "Saving";
  }

  if (
    normalized.includes("want") ||
    normalized.includes("fun") ||
    normalized.includes("discretion")
  ) {
    return "Want";
  }

  return "Need";
}

function normalizeLegacyAllocations(
  allocations: BudgetAllocationEntry[],
): BudgetExpense[] {
  return allocations.map((allocation) =>
    createBudgetExpense({
      name: allocation.category,
      amount: allocation.amount,
      category: inferLegacyCategoryType(allocation.category),
    }),
  );
}

// ---------------------------------------------------------------------------
// Exported factories and predicates
// ---------------------------------------------------------------------------

/** Create a BudgetExpense with safe defaults; any field can be overridden. */
export function createBudgetExpense(
  overrides: Partial<BudgetExpense> = {},
): BudgetExpense {
  return {
    expenseId: trimText(overrides.expenseId) || generateId(),
    name: overrides.name ?? "",
    amount: overrides.amount ?? 0,
    category: overrides.category ?? "Need",
    group: overrides.group ?? "",
  };
}

/** Return the initial form state for a brand-new budget. */
export function createDefaultBudgetDraft(): BudgetDraft {
  return {
    name: "",
    monthlyIncome: 5000,
    expenses: [createBudgetExpense()],
  };
}

/**
 * Return true when an expense row has at least one filled-in field.
 * Used by the editor to decide whether a row should be kept on save.
 */
export function hasBudgetRowContent(expense: BudgetExpense): boolean {
  return (
    trimText(expense.name).length > 0 ||
    normalizePositiveAmount(Number(expense.amount)) > 0 ||
    trimText(expense.group).length > 0
  );
}

// ---------------------------------------------------------------------------
// Path-segment parsing (shared with sankey-builder)
// ---------------------------------------------------------------------------

/**
 * Note 4: Parse the free-text "group" field into an ordered list of Sankey
 * branch labels. Several separator styles are accepted so users who paste
 * examples from different sources (HTML, keyboard "›", slash) don't get
 * confused when the diagram silently ignores their input.
 *
 * The trailing segment is stripped when it matches the expense name so that
 * `Housing > Rent` on a "Rent" expense produces ["Housing"], not
 * ["Housing", "Rent"].
 */
export function parseSankeyPathSegments(
  pathValue: string | undefined,
  expenseName?: string,
): string[] {
  const raw = trimText(pathValue);
  if (!raw) return [];

  // Accept several common separators and HTML-encoded forms so users can
  // paste different examples. Normalize everything to the simple '>' token
  // then split. Also trim each segment and ignore empties.
  const normalized = raw
    .replace(/&gt;|&#62;/gi, ">") // HTML entities
    .replace(/›|\u203A/g, ">") // single right-pointing angle quote
    .replace(/[/]/g, ">") // allow slash as alternative separator
    .replace(/>{2,}/g, ">"); // collapse repeated separators

  const segments = normalized
    .split(">")
    .map((s) => trimText(s))
    .filter(Boolean);

  const normalizedExpenseName = trimText(expenseName).toLowerCase();

  while (
    segments.length > 0 &&
    segments[segments.length - 1].toLowerCase() === normalizedExpenseName
  ) {
    segments.pop();
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Budget normalizers (editor ↔ storage round-trips)
// ---------------------------------------------------------------------------

/**
 * Sanitize an array of raw expense inputs, optionally generating placeholder
 * names so the preview chart stays usable while the form is partially filled.
 *
 * Note 5: Preview charts need a stable label even while the user is halfway
 * through filling the form. `fallbackNames: true` keeps the visuals usable
 * without silently persisting unnamed expenses when the user saves.
 */
export function normalizeBudgetExpenses(
  expenses: BudgetExpenseInput[],
  { fallbackNames }: { fallbackNames: boolean },
): BudgetExpense[] {
  let fallbackIndex = 1;
  const normalizedExpenses: BudgetExpense[] = [];

  for (const expense of expenses) {
    const amount = normalizePositiveAmount(Number(expense.amount));
    const category = expense.category ?? "Need";
    if (amount <= 0) {
      continue;
    }

    const trimmedName = trimText(expense.name);
    if (!trimmedName && !fallbackNames) {
      continue;
    }

    const name = trimmedName || `Expense ${fallbackIndex++}`;

    normalizedExpenses.push({
      expenseId: trimText(expense.expenseId) || generateId(),
      name,
      amount,
      category,
      group: trimText(expense.group),
    });
  }

  return normalizedExpenses;
}

/**
 * Hydrate a raw SavedBudget (possibly in legacy format) into a BudgetDraft
 * suitable for the editor form. Handles missing income, legacy allocations,
 * and ensures at least one blank row is always present.
 */
export function normalizeBudgetForEditor(
  budget?: Partial<SavedBudget> | null,
): BudgetDraft {
  if (!budget) {
    return createDefaultBudgetDraft();
  }

  const expenses = budget.expenses?.length
    ? budget.expenses.map((expense) =>
        createBudgetExpense({
          ...expense,
          name: trimText(expense.name),
          amount: normalizePositiveAmount(Number(expense.amount)),
          group: trimText(expense.group),
        }),
      )
    : normalizeLegacyAllocations(budget.allocations ?? []);

  const totalExpenses = roundCurrency(
    expenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  return {
    budgetId: budget.budgetId,
    name: budget.name ?? "",
    monthlyIncome:
      typeof budget.monthlyIncome === "number" && budget.monthlyIncome > 0
        ? roundCurrency(budget.monthlyIncome)
        : totalExpenses,
    expenses: expenses.length ? expenses : [createBudgetExpense()],
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

/**
 * Validate and sanitize a BudgetDraft before writing it to storage.
 * Strips unnamed/zero-amount rows and writes both the typed `expenses`
 * array and the legacy `allocations` field for backwards compatibility.
 *
 * Note 6: The legacy `allocations` field is still written so older callers
 * can keep reading the simplified `{ category, amount }` shape while the UI
 * now relies on the richer `expenses` array for grouping and category types.
 */
export function normalizeBudgetForStorage(
  budget: Omit<Partial<BudgetDraft>, "expenses"> & {
    expenses?: BudgetExpenseInput[];
  },
): SavedBudget {
  const expenses = normalizeBudgetExpenses(budget.expenses ?? [], {
    fallbackNames: false,
  });
  const totalExpenses = roundCurrency(
    expenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  return {
    budgetId: budget.budgetId,
    name: trimText(budget.name) || "Untitled budget",
    monthlyIncome:
      normalizePositiveAmount(Number(budget.monthlyIncome ?? 0)) ||
      totalExpenses,
    expenses,
    allocations: expenses.map((expense) => ({
      category: expense.name,
      amount: expense.amount,
    })),
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}
