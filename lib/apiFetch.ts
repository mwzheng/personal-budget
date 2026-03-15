import {
  clearCognitoTokens,
  getStoredCognitoTokens,
  isDemoSessionActive,
  normalizeCognitoDomain,
  storeCognitoTokens,
} from "./cognitoClient";

// Note 1: `apiFetch` is a drop-in replacement for the native `fetch` API that
// routes demo sessions to a browser-only local store and automatically attaches
// Cognito JWTs for real users. That keeps all pages on one fetch abstraction
// while preserving the correct persistence layer for each auth mode.
export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  if (typeof window !== "undefined" && isDemoSessionActive()) {
    const requestUrl = typeof input === "string" ? input : input.url;
    const url = new URL(requestUrl, window.location.origin);

    if (url.pathname.startsWith("/api/")) {
      const { handleDemoApiRequest } = await import("./demoApi");
      return handleDemoApiRequest(input, init);
    }
  }

  // Attach Authorization header from sessionStorage if present (access_token or id_token)
  const headers = new Headers((init?.headers as HeadersInit) || {});

  // Helper to perform the fetch with provided headers
  const doFetch = async (useHeaders: Headers) => {
    return fetch(input, { ...(init || {}), headers: useHeaders });
  };

  try {
    // Note 2: `typeof window !== "undefined"` is the standard guard for
    // client-only code. Next.js executes components on both server and client
    // (SSR), so any code that uses browser APIs like `sessionStorage` must be
    // wrapped in this check to avoid runtime errors during server rendering.
    if (typeof window !== "undefined") {
      const { accessToken, idToken, refreshToken } = getStoredCognitoTokens();
      // Note 3: Prefer the access token over the id token. The access token is
      // designed for authorizing API calls, while the id token contains identity
      // claims. Both are JWTs; using access_token is the OAuth 2.0 best practice.
      const token = accessToken || idToken;

      if (token) headers.set("Authorization", `Bearer ${token}`);

      // First attempt with existing token (if any)
      let res = await doFetch(headers);

      // If unauthorized and we have a refresh token, try refreshing once
      // Note 4: A 401 (Unauthorized) or 403 (Forbidden) with a valid refresh
      // token means the access token has expired. We attempt a single silent
      // refresh using the OAuth 2.0 refresh_token grant before giving up.
      if ((res.status === 401 || res.status === 403) && refreshToken) {
        try {
          const domain = normalizeCognitoDomain(
            process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
          );
          const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
          if (domain && clientId) {
            // Note 5: The token endpoint expects `application/x-www-form-urlencoded`
            // (not JSON). `URLSearchParams` builds the correct body format and sets
            // the Content-Type header automatically when passed to `fetch`.
            const body = new URLSearchParams();
            body.set("grant_type", "refresh_token");
            body.set("client_id", clientId);
            body.set("refresh_token", refreshToken);

            const tokenRes = await fetch(`${domain}/oauth2/token`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body,
            });

            if (tokenRes.ok) {
              const data = await tokenRes.json();
              // Preserve the existing refresh token unless Cognito rotates it.
              // Note 6: Cognito usually omits `refresh_token` on refresh grants,
              // so we merge the current value back in before storing the payload.
              storeCognitoTokens({
                access_token: data.access_token,
                id_token: data.id_token,
                refresh_token: data.refresh_token || refreshToken,
              });

              const newToken = data.access_token || data.id_token;
              if (newToken) {
                const newHeaders = new Headers(
                  (init?.headers as HeadersInit) || {},
                );
                newHeaders.set("Authorization", `Bearer ${newToken}`);
                // Retry original request with refreshed token
                res = await doFetch(newHeaders);
                return res;
              }
            } else {
              // Refresh failed - clear tokens to force re-auth
              // Note 7: Clearing all three tokens forces the user back to the
              // login page on the next navigation, which is the safest recovery
              // path when the refresh token is expired or revoked.
              clearCognitoTokens();
            }
          }
        } catch (err) {
          // Log refresh errors and fall through to return original response
          // eslint-disable-next-line no-console
          console.error("apiFetch refresh error", err);
        }
      }

      return res;
    }
  } catch {
    // ignore client-side storage errors
  }

  // Note 8: This fallback runs on the server (SSR/RSC) or when sessionStorage
  // is unavailable. Server-to-server requests do not need an Authorization header
  // because they are authenticated through a different mechanism (e.g., IAM roles
  // or server-side session cookies that are not visible here).
  return fetch(input, { ...(init || {}), headers });
}
