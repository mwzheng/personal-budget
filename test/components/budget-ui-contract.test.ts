import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("Budget page visual contracts", () => {
  it("uses the shared category colors for comparison bars", () => {
    const comparison = readSource("components/budget/ActualVsBudget.tsx");

    expect(comparison).toContain("barColor={CATEGORY_COLORS.Need}");
    expect(comparison).toContain("barColor={CATEGORY_COLORS.Want}");
    expect(comparison).toContain("barColor={CATEGORY_COLORS.Saving}");
  });

  it("provides an editable month and year picker for budget comparisons", () => {
    const comparison = readSource("components/budget/ActualVsBudget.tsx");

    expect(comparison).toContain('from "@mui/x-date-pickers/DatePicker"');
    expect(comparison).toContain('views={["year", "month"]}');
    expect(comparison).toContain('format="MMMM yyyy"');
    expect(comparison).not.toContain('type="month"');
  });

  it("starts expense categories collapsed with accessible toggles", () => {
    const form = readSource("components/budget/BudgetForm.tsx");

    expect(form).toContain("{ Need: true, Want: true, Saving: true }");
    expect(form).toContain("aria-expanded={!collapsedCategories[category]}");
    expect(form).toContain("aria-controls={`expense-category-${category}`}");
  });

  it("uses contrast-aware labels in the allocation bar", () => {
    const allocation = readSource("components/budget/AllocationBar.tsx");

    expect(allocation).toContain("height: 32");
    expect(allocation).toContain("theme.palette.getContrastText");
  });

  it("describes the budget allocation state without treating it as savings", () => {
    const budgetPage = readSource("app/budget/page.tsx");

    expect(budgetPage).toContain('label="Budget Allocation"');
    expect(budgetPage).toContain('"Unallocated budget"');
    expect(budgetPage).toContain('"Over-allocated budget"');
    expect(budgetPage).toContain('"Fully allocated budget"');
    expect(budgetPage).not.toContain("savings rate");
  });
});
