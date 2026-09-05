import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api/apiFetch";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearCognitoTokens,
} from "@/lib/auth/cognitoClient";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("apiFetch Cognito refresh", () => {
  const originalCognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const originalCognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  let localStorage: MemoryStorage;
  let resolveRefresh: () => void;

  beforeEach(() => {
    localStorage = new MemoryStorage();
    const sessionStorage = new MemoryStorage();
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
      location: { origin: "http://localhost" },
      dispatchEvent: vi.fn(),
    } as unknown as Window & typeof globalThis);
    localStorage.setItem(ACCESS_TOKEN_KEY, "expired-access-token");
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh-token-123");
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = "https://auth.example.com";
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "client-123";
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

  it("coalesces concurrent 401 refreshes and retries each original request once", async () => {
    let refreshRequests = 0;
    const apiRequests = new Map<string, number>();
    const refreshResponse = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetchSpy = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "https://auth.example.com/oauth2/token") {
          refreshRequests += 1;
          await refreshResponse;
          return new Response(
            JSON.stringify({ access_token: "fresh-access-token" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        apiRequests.set(url, (apiRequests.get(url) ?? 0) + 1);
        const authorization = new Headers(init?.headers).get("Authorization");
        return new Response(null, {
          status: authorization === "Bearer fresh-access-token" ? 200 : 401,
        });
      },
    );
    vi.stubGlobal("fetch", fetchSpy);

    const first = apiFetch("/api/first", { method: "POST" });
    const second = apiFetch("/api/second", { method: "POST" });

    await vi.waitFor(() => expect(refreshRequests).toBe(1));
    resolveRefresh!();

    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(refreshRequests).toBe(1);
    expect(apiRequests).toEqual(
      new Map([
        ["/api/first", 2],
        ["/api/second", 2],
      ]),
    );
  });

  it("does not join an in-flight refresh from a previous session", async () => {
    let refreshRequests = 0;
    const firstRefresh = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetchSpy = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "https://auth.example.com/oauth2/token") {
          refreshRequests += 1;
          if (refreshRequests === 1) {
            await firstRefresh;
            return new Response(
              JSON.stringify({ access_token: "stale-access-token" }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          return new Response(
            JSON.stringify({ access_token: "fresh-access-token" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const authorization = new Headers(init?.headers).get("Authorization");
        return new Response(null, {
          status: authorization === "Bearer fresh-access-token" ? 200 : 401,
        });
      },
    );
    vi.stubGlobal("fetch", fetchSpy);

    const staleRequest = apiFetch("/api/stale", { method: "POST" });
    await vi.waitFor(() => expect(refreshRequests).toBe(1));

    localStorage.setItem(ACCESS_TOKEN_KEY, "new-expired-access-token");
    localStorage.setItem(REFRESH_TOKEN_KEY, "new-refresh-token");
    const currentRequest = apiFetch("/api/current", { method: "POST" });

    await vi.waitFor(() => expect(refreshRequests).toBe(2));
    expect((await currentRequest).status).toBe(200);

    resolveRefresh!();
    expect((await staleRequest).status).toBe(401);
  });
});
