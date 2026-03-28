/**
 * Note 1: Centralized Bearer token extraction from Authorization headers.
 * The regex `^Bearer (.+)$` captures everything after "Bearer " into group 1.
 * The `i` flag makes the match case-insensitive so both "Bearer" and "bearer"
 * are accepted, following the RFC 6750 spec. Extracting this into a shared
 * helper eliminates duplication across auth modules.
 */

const BEARER_RE = /^Bearer (.+)$/i;

/**
 * Parse a Bearer token from an HTTP Authorization header value.
 * Returns the raw JWT string on success, or `null` when the header is missing,
 * empty, or does not use the Bearer scheme.
 */
export function parseBearerToken(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(BEARER_RE);
  return match ? match[1] : null;
}
