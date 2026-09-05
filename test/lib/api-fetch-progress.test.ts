import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getStoredCognitoTokens = vi.fn();

vi.mock("@/lib/auth/cognitoClient", () => ({
  clearCognitoTokens: vi.fn(),
  getStoredCognitoTokens,
  isDemoSessionActive: vi.fn(() => false),
  normalizeCognitoDomain: vi.fn(),
  storeCognitoTokens: vi.fn(),
}));

describe("progress api request coordination", () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    getStoredCognitoTokens.mockReturnValue({
      accessToken: "user-one-token",
      idToken: null,
      refreshToken: null,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { origin: "http://localhost" } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
    globalThis.fetch = originalFetch;
  });

  it("coalesces concurrent reads only for the same authenticated user, progress resource, and query", async () => {
    const pendingFetches: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn(
      (..._args: Parameters<typeof fetch>) =>
        new Promise<Response>((resolve) => {
          pendingFetches.push(resolve);
        }),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    const first = apiFetch("/api/progress/retirement?year=2025");
    const duplicate = apiFetch("/api/progress/retirement?year=2025");
    const differentQuery = apiFetch("/api/progress/retirement?year=2026");

    getStoredCognitoTokens.mockReturnValue({
      accessToken: "user-two-token",
      idToken: null,
      refreshToken: null,
    });
    const differentUser = apiFetch("/api/progress/retirement?year=2025");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    pendingFetches.forEach((resolve) =>
      resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    await Promise.all([first, duplicate, differentQuery, differentUser]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("invalidates retirement and its derived goal read after a retirement mutation, without invalidating milestones", async () => {
    const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true, entries: [] }), {
          status: 200,
        }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    await apiFetch("/api/progress/retirement");
    await apiFetch("/api/progress/goal");
    await apiFetch("/api/progress/milestones");
    await apiFetch("/api/progress/retirement", { method: "POST" });
    await apiFetch("/api/progress/retirement");
    await apiFetch("/api/progress/goal");
    await apiFetch("/api/progress/milestones");

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(fetchMock.mock.calls.map(([input]) => input)).toEqual([
      "/api/progress/retirement",
      "/api/progress/goal",
      "/api/progress/milestones",
      "/api/progress/retirement",
      "/api/progress/retirement",
      "/api/progress/goal",
    ]);
  });

  it("coalesces concurrent salary reads for the same authenticated user", async () => {
    const pendingFetches: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn(
      (..._args: Parameters<typeof fetch>) =>
        new Promise<Response>((resolve) => {
          pendingFetches.push(resolve);
        }),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    const first = apiFetch("/api/salary");
    const duplicate = apiFetch("/api/salary");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    pendingFetches[0](
      new Response(JSON.stringify({ annualSalary: 100000 }), { status: 200 }),
    );
    await Promise.all([first, duplicate]);
  });

  it("serves repeated salary reads for the same authenticated user from the short-lived cache", async () => {
    const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
      Promise.resolve(
        new Response(JSON.stringify({ annualSalary: 100000 }), { status: 200 }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    await apiFetch("/api/salary");
    await apiFetch("/api/salary");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("isolates cached salary reads by auth token", async () => {
    const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
      Promise.resolve(
        new Response(JSON.stringify({ annualSalary: 100000 }), { status: 200 }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    await apiFetch("/api/salary");
    getStoredCognitoTokens.mockReturnValue({
      accessToken: "user-two-token",
      idToken: null,
      refreshToken: null,
    });
    await apiFetch("/api/salary");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("invalidates only the current user's salary cache after a salary mutation", async () => {
    const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    await apiFetch("/api/salary");
    getStoredCognitoTokens.mockReturnValue({
      accessToken: "user-two-token",
      idToken: null,
      refreshToken: null,
    });
    await apiFetch("/api/salary");
    getStoredCognitoTokens.mockReturnValue({
      accessToken: "user-one-token",
      idToken: null,
      refreshToken: null,
    });
    await apiFetch("/api/salary", { method: "PUT" });
    await apiFetch("/api/salary");
    getStoredCognitoTokens.mockReturnValue({
      accessToken: "user-two-token",
      idToken: null,
      refreshToken: null,
    });
    await apiFetch("/api/salary");

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("does not invalidate cached progress reads after a salary mutation", async () => {
    const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const { apiFetch } = await import("@/lib/api/apiFetch");

    await apiFetch("/api/salary");
    await apiFetch("/api/progress/milestones");
    await apiFetch("/api/salary", { method: "PUT" });
    await apiFetch("/api/progress/milestones");

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
