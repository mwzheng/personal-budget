// Note 1: These tests lock down the browser-only demo session so future auth or
// API refactors do not accidentally route demo writes through the real network.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api/apiFetch";
import {
  ACCESS_TOKEN_KEY,
  clearCognitoTokens,
  getStoredCognitoTokens,
  hasStoredCognitoTokens,
  isAuthenticated,
  isDemoSessionActive,
  ID_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  startDemoSession,
} from "@/lib/auth/cognitoClient";

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
  const originalCognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const originalCognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

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
    if (originalCognitoDomain === undefined) {
      delete process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    } else {
      process.env.NEXT_PUBLIC_COGNITO_DOMAIN = originalCognitoDomain;
    }
    if (originalCognitoClientId === undefined) {
      delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    } else {
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = originalCognitoClientId;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts a browser-only demo session and seeds demo data", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "real-access");
    localStorage.setItem(ID_TOKEN_KEY, "real-id");
    localStorage.setItem(REFRESH_TOKEN_KEY, "real-refresh");

    await startDemoSession();

    expect(isDemoSessionActive()).toBe(true);
    expect(hasStoredCognitoTokens()).toBe(false);
    expect(isAuthenticated()).toBe(true);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ID_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(dispatchEvent).toHaveBeenCalledTimes(1);

    const persistedDemoStore = localStorage.getItem(
      "porridge-budget-demo-store",
    );
    expect(persistedDemoStore).not.toBeNull();
    expect(JSON.parse(persistedDemoStore!).transactions.length).toBeGreaterThan(
      0,
    );
  });

  it("treats a stored refresh token as evidence of an active session", () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh-only");
    expect(hasStoredCognitoTokens()).toBe(true);
  });

  it("restores persisted real auth state from localStorage after a restart", () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "access");
    localStorage.setItem(ID_TOKEN_KEY, "id");
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh");

    expect(getStoredCognitoTokens()).toEqual({
      accessToken: "access",
      idToken: "id",
      refreshToken: "refresh",
    });
    expect(hasStoredCognitoTokens()).toBe(true);
    expect(isAuthenticated()).toBe(true);
  });

  it("clears all tokens when calling clearCognitoTokens", () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "access");
    localStorage.setItem(ID_TOKEN_KEY, "id");
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh");
    sessionStorage.setItem("porridge-budget-demo-session", "true");
    clearCognitoTokens();

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ID_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem("porridge-budget-demo-session")).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("removes refresh-only credentials so auth state becomes false", () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh-only");

    expect(hasStoredCognitoTokens()).toBe(true);

    clearCognitoTokens();

    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(hasStoredCognitoTokens()).toBe(false);
    expect(isAuthenticated()).toBe(false);
  });

  it("serves demo transactions without touching the real network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    localStorage.setItem(ACCESS_TOKEN_KEY, "real-access-token");
    localStorage.setItem(REFRESH_TOKEN_KEY, "real-refresh-token");

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

  // Note 2: Handler-module coverage — these tests hit the split handler files
  // (salaryHandlers and progressHandlers) to verify that each handler correctly
  // reads from / writes to the demo store without any real network calls. The
  // fetchSpy guard confirms no HTTP traffic is produced.

  it("serves salary entries and supports creating then deleting an entry", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const listResponse = await apiFetch("/api/salary");
    const listPayload = (await listResponse.json()) as {
      ok: boolean;
      entries: Array<{ entryId: string; year: number; amount: number }>;
    };
    expect(listPayload.ok).toBe(true);
    expect(Array.isArray(listPayload.entries)).toBe(true);

    const createResponse = await apiFetch("/api/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2030, amount: 95000 }),
    });
    const createPayload = (await createResponse.json()) as {
      ok: boolean;
      created: { entryId: string; year: number };
    };
    expect(createPayload.ok).toBe(true);
    expect(createPayload.created.year).toBe(2030);

    const deleteResponse = await apiFetch("/api/salary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: createPayload.created.entryId }),
    });
    expect(((await deleteResponse.json()) as { ok: boolean }).ok).toBe(true);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 when creating a salary entry without year or amount", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const response = await apiFetch("/api/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "No year or amount" }),
    });

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("serves retirement entries and supports creating a new entry", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const listResponse = await apiFetch("/api/progress/retirement");
    const listPayload = (await listResponse.json()) as {
      ok: boolean;
      entries: Array<unknown>;
    };
    expect(listPayload.ok).toBe(true);
    expect(Array.isArray(listPayload.entries)).toBe(true);

    const createResponse = await apiFetch("/api/progress/retirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: 2030,
        startAmount: 100000,
        endAmount: 115000,
      }),
    });
    const createPayload = (await createResponse.json()) as {
      ok: boolean;
      created: { entryId: string; year: number };
    };
    expect(createPayload.ok).toBe(true);
    expect(createPayload.created.year).toBe(2030);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 when creating a retirement entry with missing amounts", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const response = await apiFetch("/api/progress/retirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2030 }),
    });

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates and retrieves the progress goal in demo mode", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const createResponse = await apiFetch("/api/progress/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetAmount: 500000 }),
    });
    const createPayload = (await createResponse.json()) as {
      ok: boolean;
      created: { goalId: string; targetAmount: number };
    };
    expect(createPayload.ok).toBe(true);
    expect(createPayload.created.targetAmount).toBe(500000);

    const getResponse = await apiFetch("/api/progress/goal");
    const getPayload = (await getResponse.json()) as {
      ok: boolean;
      goals: Array<{ targetAmount: number }>;
    };
    expect(getPayload.ok).toBe(true);
    expect(getPayload.goals.some((g) => g.targetAmount === 500000)).toBe(true);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates and deletes a milestone in demo mode", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const createResponse = await apiFetch("/api/progress/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100000, year: 2035 }),
    });
    const createPayload = (await createResponse.json()) as {
      ok: boolean;
      created: { milestoneId: string };
    };
    expect(createPayload.ok).toBe(true);

    const deleteResponse = await apiFetch("/api/progress/milestones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId: createPayload.created.milestoneId }),
    });
    expect(((await deleteResponse.json()) as { ok: boolean }).ok).toBe(true);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 when deleting a milestone without providing a milestoneId", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await startDemoSession();

    const response = await apiFetch("/api/progress/milestones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not restore Cognito tokens after sign-out during a refresh", async () => {
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = "https://auth.example.com";
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "client-123";
    localStorage.setItem(ACCESS_TOKEN_KEY, "expired-access-token");
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh-token-123");

    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockImplementationOnce(async () => {
        clearCognitoTokens();
        return new Response(
          JSON.stringify({
            access_token: "fresh-access-token",
            id_token: "fresh-id-token",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      });

    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiFetch("/api/reports");

    expect(response.status).toBe(401);
    expect(hasStoredCognitoTokens()).toBe(false);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
