import { describe, expect, it } from "vitest";
import { upsertSavedBudget } from "../../lib/utils/budget-list";
import type { SavedBudget } from "../../lib/types/types";

const budget = (
  budgetId: string,
  updatedAt: string,
  name = budgetId,
): SavedBudget => ({
  budgetId,
  name,
  updatedAt,
});

describe("upsertSavedBudget", () => {
  it("replaces an existing budget and keeps the list sorted without fetching", () => {
    const existing = budget("older", "2026-01-01T00:00:00.000Z");
    const current = [existing, budget("other", "2026-02-01T00:00:00.000Z")];
    const saved = budget("older", "2026-03-01T00:00:00.000Z", "Updated");

    expect(upsertSavedBudget(current, saved)).toEqual([saved, current[1]]);
    expect(current).toEqual([existing, current[1]]);
  });

  it("adds a newly created budget and ignores a response without an id", () => {
    const current = [budget("existing", "2026-01-01T00:00:00.000Z")];
    const created = budget("created", "2026-02-01T00:00:00.000Z");

    expect(upsertSavedBudget(current, created)).toEqual([created, current[0]]);
    expect(upsertSavedBudget(current, { name: "invalid" })).toEqual(current);
  });
});
