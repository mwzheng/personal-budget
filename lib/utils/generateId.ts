/**
 * Note 1: Centralised ID generation utilities for the entire codebase.
 *
 * Two distinct helpers live here because the application has two different
 * randomness needs:
 *
 *  • `generateId` — UUID-based identifiers for domain entities (transactions,
 *    budgets, progress goals, etc.). Uses `crypto.randomUUID()` when available
 *    and falls back to a `Date.now()` + random-suffix approach for older
 *    runtimes.
 *
 *  • `randomString` — Fixed-length alphanumeric strings for security-sensitive
 *    flows such as PKCE code verifiers and OAuth state parameters. Built on
 *    `crypto.getRandomValues` for cryptographic quality.
 *
 * Keeping both in one module eliminates 7+ duplicated implementations that
 * previously existed across `lib/auth`, `lib/demo`, `lib/utils`, `lib/api`,
 * and `app/api`.
 */

/**
 * Generate a unique identifier, optionally prefixed.
 *
 * @param prefix - When supplied the returned string is `"<prefix>-<uuid>"`.
 *   Omit the prefix to get a bare UUID / timestamp-based id.
 * @returns A string suitable for use as a primary or sort-key identifier.
 *
 * @example
 * ```ts
 * generateId();              // "b1c7e9a2-..."
 * generateId("demo-tx");     // "demo-tx-b1c7e9a2-..."
 * ```
 */
export function generateId(prefix?: string): string {
  // Note 2: `crypto.randomUUID()` is available in Node 19+, all modern
  // browsers, and Cloudflare Workers. The typeof guard protects against SSR
  // environments where `crypto` may be undefined (e.g. very old Node builds).
  const raw =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return prefix ? `${prefix}-${raw}` : raw;
}

/**
 * Generate a cryptographically random alphanumeric string of the given length.
 *
 * Note 3: This is purpose-built for the PKCE code-verifier / OAuth state
 * parameter in the Cognito auth flow. It uses `crypto.getRandomValues` (not
 * `randomUUID`) because PKCE verifiers must be a specific character length
 * and drawn from an unrestricted alphanumeric alphabet.
 *
 * @param length - Desired string length. Defaults to 64 characters.
 * @returns An alphanumeric string of exactly `length` characters.
 */
export function randomString(length: number = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => (value % 36).toString(36))
    .join("")
    .slice(0, length);
}
