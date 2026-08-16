import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLastSelectedReportFilters,
  getLastSelectedReportTransactionsView,
  setLastSelectedReportFilters,
  setLastSelectedReportTransactionsView,
} from "@/lib/utils/storage";

class MemoryStorage {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe("storage report view preference", () => {
  beforeEach(() => {
    const localStorage = new MemoryStorage();
    vi.stubGlobal("window", {
      localStorage,
    } as unknown as Window & typeof globalThis);
    vi.stubGlobal("localStorage", localStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to table when no browser preference is stored", () => {
    expect(getLastSelectedReportTransactionsView()).toBe("table");
  });

  it("restores a previously saved calendar view preference", () => {
    setLastSelectedReportTransactionsView("calendar");

    expect(getLastSelectedReportTransactionsView()).toBe("calendar");
  });

  it("falls back to table for unexpected stored values", () => {
    window.localStorage.setItem(
      "personal-budget-last-report-transactions-view",
      "grid",
    );

    expect(getLastSelectedReportTransactionsView()).toBe("table");
  });
});

describe("storage complete report filter preference", () => {
  beforeEach(() => {
    const localStorage = new MemoryStorage();
    vi.stubGlobal("window", {
      localStorage,
    } as unknown as Window & typeof globalThis);
    vi.stubGlobal("localStorage", localStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round trips a normalized complete preference", () => {
    setLastSelectedReportFilters({
      years: [" 2024 ", "2024", "2023"],
      startDate: null,
      endDate: null,
      categories: ["Need", "Need", "Income"],
      tags: [" groceries ", "groceries", "work"],
      search: "  coffee  ",
    });

    expect(getLastSelectedReportFilters()).toEqual({
      years: ["2024", "2023"],
      startDate: null,
      endDate: null,
      categories: ["Need", "Income"],
      tags: ["groceries", "work"],
      search: "coffee",
    });
  });

  it("distinguishes a valid empty preference from no preference", () => {
    expect(getLastSelectedReportFilters()).toBeNull();

    setLastSelectedReportFilters({
      years: [],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
    });

    expect(getLastSelectedReportFilters()).toEqual({
      years: [],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
    });
  });

  it.each([
    "not-json",
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 2, filters: {} }),
    JSON.stringify({
      version: 1,
      filters: {
        years: ["24"],
        startDate: null,
        endDate: null,
        categories: [],
        tags: [],
        search: "",
      },
    }),
    JSON.stringify({
      version: 1,
      filters: {
        years: [],
        startDate: "2024-02-30",
        endDate: null,
        categories: [],
        tags: [],
        search: "",
      },
    }),
    JSON.stringify({
      version: 1,
      filters: {
        years: [],
        startDate: "2024-12-31",
        endDate: "2024-01-01",
        categories: [],
        tags: [],
        search: "",
      },
    }),
    JSON.stringify({
      version: 1,
      filters: {
        years: ["2024"],
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        categories: [],
        tags: [],
        search: "",
      },
    }),
    JSON.stringify({
      version: 1,
      filters: {
        years: [],
        startDate: null,
        endDate: null,
        categories: ["Other"],
        tags: [],
        search: "",
      },
    }),
    JSON.stringify({
      version: 1,
      filters: {
        years: [],
        startDate: null,
        endDate: null,
        categories: [],
        tags: [3],
        search: "",
      },
    }),
  ])("rejects malformed, partial, or invalid payloads: %s", (payload) => {
    window.localStorage.setItem("personal-budget-report-filters", payload);

    expect(getLastSelectedReportFilters()).toBeNull();
  });
});
