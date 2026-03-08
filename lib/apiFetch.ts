// Note 1: `apiFetch` is a drop-in replacement for the native `fetch` API that
// automatically attaches the user's JWT access token to every outgoing request.
// It also handles silent token refresh when the server returns a 401/403 response,
// so the rest of the app never needs to manage token lifecycle directly.
export async function apiFetch(input: RequestInfo, init?: RequestInit) {
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
      const accessToken = window.sessionStorage.getItem("access_token");
      const idToken = window.sessionStorage.getItem("id_token");
      const refreshToken = window.sessionStorage.getItem("refresh_token");
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
          const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
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
              // Update stored tokens if returned
              if (data.access_token)
                window.sessionStorage.setItem(
                  "access_token",
                  data.access_token,
                );
              if (data.id_token)
                window.sessionStorage.setItem("id_token", data.id_token);
              // Preserve existing refresh_token unless server returned a new one
              // Note 6: Cognito does not rotate refresh tokens by default, so
              // `data.refresh_token` is often absent. We keep the existing token
              // unless the server explicitly provides a replacement.
              if (data.refresh_token)
                window.sessionStorage.setItem(
                  "refresh_token",
                  data.refresh_token,
                );

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
              window.sessionStorage.removeItem("access_token");
              window.sessionStorage.removeItem("id_token");
              window.sessionStorage.removeItem("refresh_token");
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
  } catch (e) {
    // ignore client-side storage errors
  }

  // Note 8: This fallback runs on the server (SSR/RSC) or when sessionStorage
  // is unavailable. Server-to-server requests do not need an Authorization header
  // because they are authenticated through a different mechanism (e.g., IAM roles
  // or server-side session cookies that are not visible here).
  return fetch(input, { ...(init || {}), headers });
}
