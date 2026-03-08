export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  // Attach Authorization header from sessionStorage if present (access_token or id_token)
  const headers = new Headers((init?.headers as HeadersInit) || {});

  // Helper to perform the fetch with provided headers
  const doFetch = async (useHeaders: Headers) => {
    return fetch(input, { ...(init || {}), headers: useHeaders });
  };

  try {
    if (typeof window !== "undefined") {
      const accessToken = window.sessionStorage.getItem("access_token");
      const idToken = window.sessionStorage.getItem("id_token");
      const refreshToken = window.sessionStorage.getItem("refresh_token");
      const token = accessToken || idToken;

      if (token) headers.set("Authorization", `Bearer ${token}`);

      // First attempt with existing token (if any)
      let res = await doFetch(headers);

      // If unauthorized and we have a refresh token, try refreshing once
      if ((res.status === 401 || res.status === 403) && refreshToken) {
        try {
          const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
          const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
          if (domain && clientId) {
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
              if (data.access_token) window.sessionStorage.setItem("access_token", data.access_token);
              if (data.id_token) window.sessionStorage.setItem("id_token", data.id_token);
              // Preserve existing refresh_token unless server returned a new one
              if (data.refresh_token) window.sessionStorage.setItem("refresh_token", data.refresh_token);

              const newToken = data.access_token || data.id_token;
              if (newToken) {
                const newHeaders = new Headers((init?.headers as HeadersInit) || {});
                newHeaders.set("Authorization", `Bearer ${newToken}`);
                // Retry original request with refreshed token
                res = await doFetch(newHeaders);
                return res;
              }
            } else {
              // Refresh failed - clear tokens to force re-auth
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

  // Fallback for server-side or when window isn't available
  return fetch(input, { ...(init || {}), headers });
}

