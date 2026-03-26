/**
 * Note 1: Shared utilities for demo API handler modules. These helpers extract
 * request context (body parsing, JSON response construction) so individual
 * handler files stay focused on domain logic rather than HTTP plumbing.
 */

/**
 * Context object threaded through every handler so each module receives a
 * pre-parsed URL, HTTP method, and the original fetch arguments for body reads.
 */
export interface HandlerContext {
  url: URL;
  method: string;
  input: RequestInfo | URL;
  init?: RequestInit;
}

/** Convenience wrapper that returns a JSON `Response` with proper headers. */
export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

// Note 2: `readBodyText` handles every `BodyInit` variant that the fetch spec
// allows so callers never need to worry about the concrete type of `init.body`.
export async function readBodyText(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<string> {
  const body = init?.body;

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof Blob) {
    return body.text();
  }

  if (body instanceof ArrayBuffer) {
    return new TextDecoder().decode(body);
  }

  if (body && ArrayBuffer.isView(body)) {
    return new TextDecoder().decode(body);
  }

  if (body === undefined && input instanceof Request) {
    return input.clone().text();
  }

  return "";
}

export async function readJsonBody<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T | null> {
  const raw = await readBodyText(input, init);
  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw) as T;
}
