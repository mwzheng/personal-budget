import {
  clearCognitoTokens,
  getStoredCognitoTokens,
  isDemoSessionActive,
  normalizeCognitoDomain,
  storeCognitoTokens,
} from "../auth/cognitoClient";

let refreshInFlight: {
  refreshToken: string;
  promise: Promise<string | null>;
} | null = null;
const READ_CACHE_TTL_MS = 2_000;
const progressReadCache = new Map<
  string,
  { expiresAt: number; response: Response }
>();
const progressInFlightReads = new Map<string, Promise<Response>>();

type ProgressResource = "goal" | "milestones" | "retirement";
type CachedReadResource = ProgressResource | "salary";

function getCachedReadResource(input: RequestInfo): CachedReadResource | null {
  const url = typeof input === "string" ? input : input.url;
  const pathname = url.split("?")[0];
  if (pathname === "/api/progress/goal") return "goal";
  if (pathname === "/api/progress/milestones") return "milestones";
  if (pathname === "/api/progress/retirement") return "retirement";
  if (pathname === "/api/salary") return "salary";
  return null;
}

function progressReadKey(
  input: RequestInfo,
  resource: CachedReadResource,
  token: string,
) {
  const url = typeof input === "string" ? input : input.url;
  const query = url.includes("?") ? url.slice(url.indexOf("?")) : "";
  return `${token}:${resource}:${query}`;
}

async function cachedProgressRead(
  key: string,
  request: () => Promise<Response>,
) {
  const cached = progressReadCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.response.clone();
  const pending =
    progressInFlightReads.get(key) ??
    request()
      .then((response) => {
        if (response.ok) {
          progressReadCache.set(key, {
            expiresAt: Date.now() + READ_CACHE_TTL_MS,
            response: response.clone(),
          });
        }
        return response;
      })
      .finally(() => progressInFlightReads.delete(key));
  progressInFlightReads.set(key, pending);
  return (await pending).clone();
}

function invalidateProgressReadCache(
  token: string,
  resource: ProgressResource,
) {
  const affectedResources: ProgressResource[] =
    resource === "retirement" ? ["retirement", "goal"] : [resource];
  for (const key of progressReadCache.keys()) {
    if (
      affectedResources.some((affected) =>
        key.startsWith(`${token}:${affected}:`),
      )
    ) {
      progressReadCache.delete(key);
    }
  }
}

function invalidateSalaryReadCache(token: string) {
  for (const key of progressReadCache.keys()) {
    if (key.startsWith(`${token}:salary:`)) {
      progressReadCache.delete(key);
    }
  }
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  if (refreshInFlight?.refreshToken === refreshToken) {
    return refreshInFlight.promise;
  }

  const inFlight = {
    refreshToken,
    promise: (async () => {
      const domain = normalizeCognitoDomain(
        process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
      );
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      if (!domain || !clientId) return null;
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
      });
      const tokenRes = await fetch(`${domain}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!tokenRes.ok) {
        if (getStoredCognitoTokens().refreshToken === refreshToken) {
          clearCognitoTokens();
        }
        return null;
      }
      const data = await tokenRes.json();
      if (getStoredCognitoTokens().refreshToken !== refreshToken) return null;
      storeCognitoTokens({
        access_token: data.access_token,
        id_token: data.id_token,
        refresh_token: data.refresh_token || refreshToken,
      });
      return data.access_token || data.id_token || null;
    })(),
  };
  refreshInFlight = inFlight;

  try {
    return await inFlight.promise;
  } finally {
    if (refreshInFlight === inFlight) refreshInFlight = null;
  }
}

// Note 1: `apiFetch` is a drop-in replacement for the native `fetch` API that
// routes demo sessions to a browser-only local store and automatically attaches
// Cognito JWTs for real users. That keeps all pages on one fetch abstraction
// while preserving the correct persistence layer for each auth mode.
export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  if (typeof window !== "undefined" && isDemoSessionActive()) {
    const requestUrl = typeof input === "string" ? input : input.url;
    const url = new URL(requestUrl, window.location.origin);

    if (url.pathname.startsWith("/api/")) {
      const { handleDemoApiRequest } = await import("../demo/demoApi");
      return handleDemoApiRequest(input, init);
    }
  }

  // Attach Authorization header from persisted browser auth if present
  const headers = new Headers((init?.headers as HeadersInit) || {});

  // Helper to perform the fetch with provided headers
  const doFetch = async (useHeaders: Headers) => {
    return fetch(input, { ...(init || {}), headers: useHeaders });
  };

  try {
    // Note 2: `typeof window !== "undefined"` is the standard guard for
    // client-only code. Next.js executes components on both server and client
    // (SSR), so any code that uses browser APIs like `localStorage` or
    // `sessionStorage` must be wrapped in this check to avoid runtime errors
    // during server rendering.
    if (typeof window !== "undefined") {
      const { accessToken, idToken, refreshToken } = getStoredCognitoTokens();
      // Note 3: Prefer the access token over the id token. The access token is
      // designed for authorizing API calls, while the id token contains identity
      // claims. Both are JWTs; using access_token is the OAuth 2.0 best practice.
      const token = accessToken || idToken;

      if (token) headers.set("Authorization", `Bearer ${token}`);

      // First attempt with existing token (if any)
      const method = init?.method?.toUpperCase() || "GET";
      const cachedReadResource = getCachedReadResource(input);
      const cacheKey = cachedReadResource
        ? progressReadKey(input, cachedReadResource, token || "anonymous")
        : null;
      let res =
        method === "GET" && cacheKey
          ? await cachedProgressRead(cacheKey, () => doFetch(headers))
          : await doFetch(headers);

      // If unauthorized and we have a refresh token, try refreshing once
      // Note 4: A 401 (Unauthorized) or 403 (Forbidden) with a valid refresh
      // token means the access token has expired. We attempt a single silent
      // refresh using the OAuth 2.0 refresh_token grant before giving up.
      if ((res.status === 401 || res.status === 403) && refreshToken) {
        try {
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            const latestRefreshToken = getStoredCognitoTokens().refreshToken;
            // Note 6: A pending request can outlive the user's active session if
            // they click Sign Out while a 401-triggered refresh is still in
            // flight. Re-checking the current refresh token prevents that stale
            // response from resurrecting a session the user explicitly cleared.
            if (latestRefreshToken !== refreshToken) {
              return res;
            }
            const newHeaders = new Headers(
              (init?.headers as HeadersInit) || {},
            );
            newHeaders.set("Authorization", `Bearer ${newToken}`);
            // Retry original request with refreshed token
            res = await doFetch(newHeaders);
            return res;
          }
        } catch (err) {
          // Log refresh errors and fall through to return original response
          // eslint-disable-next-line no-console
          console.error("apiFetch refresh error", err);
        }
      }

      if (method !== "GET" && res.ok && cachedReadResource) {
        if (cachedReadResource === "salary") {
          invalidateSalaryReadCache(token || "anonymous");
        } else {
          invalidateProgressReadCache(token || "anonymous", cachedReadResource);
        }
      }

      return res;
    }
  } catch {
    // ignore client-side storage errors
  }

  // Note 8: This fallback runs on the server (SSR/RSC) or when browser storage
  // is unavailable. Server-to-server requests do not need an Authorization
  // header because they are authenticated through a different mechanism (e.g.,
  // IAM roles or server-side session cookies that are not visible here).
  return fetch(input, { ...(init || {}), headers });
}
