import { describe, expect, it } from "vitest";
import { filterTransactions } from "../../lib/utils/aggregations";
import type { FilterParams, Transaction } from "../../lib/types/types";

const filters: FilterParams = {
  years: [],
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  categories: ["Need"],
  tags: ["home"],
  search: "cOfFeE",
  minAmount: 0,
  maxAmount: 999_999,
};
const transaction: Transaction = {
  id: "name",
  name: "Coffee beans",
  amount: 12.5,
  category: "Need",
  date: "2026-09-03",
  notes: "",
  paymentMethod: "card",
  tags: ["home"],
};

describe("report search scope", () => {
  it("matches case-insensitive substrings in names, notes, and tags", () => {
    const transactions: Transaction[] = [
      transaction,
      {
        ...transaction,
        id: "notes",
        name: "Shop",
        notes: "Bought COFFEE today",
      },
      {
        ...transaction,
        id: "tags",
        name: "Shop",
        tags: ["home", "iced-coffee"],
      },
      { ...transaction, id: "none", name: "Tea" },
    ];
    expect(
      filterTransactions(transactions, filters).map(({ id }) => id),
    ).toEqual(["name", "notes", "tags"]);
  });

  it("intersects search with date, category, tag, and year selections", () => {
    const transactions: Transaction[] = [
      transaction,
      { ...transaction, id: "date", date: "2026-08-31" },
      { ...transaction, id: "category", category: "Want" },
      { ...transaction, id: "tag", tags: ["work"] },
    ];
    expect(
      filterTransactions(transactions, { ...filters, years: ["2026"] }),
    ).toEqual([transaction]);
    expect(
      filterTransactions(transactions, { ...filters, years: ["2025"] }),
    ).toEqual([]);
  });

  it("clearing search retains other constraints and supports no matches", () => {
    const tea = { ...transaction, id: "tea", name: "Tea" };
    const outside = { ...transaction, id: "outside", date: "2026-10-01" };
    expect(
      filterTransactions([transaction, tea, outside], {
        ...filters,
        search: "",
      }),
    ).toEqual([transaction, tea]);
    expect(
      filterTransactions([transaction], { ...filters, search: "missing" }),
    ).toEqual([]);
  });
});
