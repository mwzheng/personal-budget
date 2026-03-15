// Note 1: These tests lock down the browser-only demo session so future auth or
// API refactors do not accidentally route demo writes through the real network.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/apiFetch";
import {
  clearCognitoTokens,
  hasStoredCognitoTokens,
  isAuthenticated,
  isDemoSessionActive,
  startDemoSession,
} from "@/lib/cognitoClient";

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

  clear(): void {
    this.map.clear();
  }
}

describe("demo mode", () => {
  let sessionStorage: MemoryStorage;
  let localStorage: MemoryStorage;
  let dispatchEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage = new MemoryStorage();
    localStorage = new MemoryStorage();
    dispatchEvent = vi.fn();

    vi.stubGlobal("window", {
      sessionStorage,
      localStorage,
      location: { origin: "http://localhost" },
      dispatchEvent,
    } as unknown as Window & typeof globalThis);
  });

  afterEach(() => {
    clearCognitoTokens();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts a browser-only demo session and seeds demo data", async () => {
    await startDemoSession();

    expect(isDemoSessionActive()).toBe(true);
    expect(hasStoredCognitoTokens()).toBe(false);
    expect(isAuthenticated()).toBe(true);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);

    const persistedDemoStore = localStorage.getItem(
      "porridge-budget-demo-store",
    );
    expect(persistedDemoStore).not.toBeNull();
    expect(JSON.parse(persistedDemoStore!).transactions.length).toBeGreaterThan(
      0,
    );
  });

  it("serves demo transactions without touching the real network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const response = await apiFetch("/api/transactions");
    const payload = (await response.json()) as {
      ok: boolean;
      transactions: Array<unknown>;
    };

    expect(response.ok).toBe(true);
    expect(payload.ok).toBe(true);
    expect(payload.transactions.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("persists demo budget edits locally across requests", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const createResponse = await apiFetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Weekend Reset Budget",
        monthlyIncome: 3200,
        expenses: [
          {
            name: "Rent",
            amount: 1200,
            category: "Need",
            group: "Housing",
          },
        ],
      }),
    });
    const createPayload = (await createResponse.json()) as { ok: boolean };

    const listResponse = await apiFetch("/api/budgets");
    const listPayload = (await listResponse.json()) as {
      budgets: Array<{ name: string }>;
    };

    expect(createPayload.ok).toBe(true);
    expect(
      listPayload.budgets.some(
        (budget) => budget.name === "Weekend Reset Budget",
      ),
    ).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
