import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLastSelectedReportTransactionsView,
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
