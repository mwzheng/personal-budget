export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  // Attach Authorization header from sessionStorage if present (id_token or access_token)
  const headers = new Headers((init?.headers as HeadersInit) || {});
  try {
    if (typeof window !== "undefined") {
      const idToken =
        window.sessionStorage.getItem("id_token") ||
        window.sessionStorage.getItem("access_token");
      if (idToken) headers.set("Authorization", `Bearer ${idToken}`);
    }
  } catch (e) {
    // ignore
  }
  const res = await fetch(input, { ...(init || {}), headers });
  return res;
}
