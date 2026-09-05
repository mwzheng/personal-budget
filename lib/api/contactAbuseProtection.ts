const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const IDEMPOTENCY_TTL_MS = 15 * 60 * 1000;
const attemptsByClient = new Map<string, number[]>();
const completedIdempotencyKeys = new Map<string, number>();

export function getContactClientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export function isContactRateLimited(clientKey: string, now = Date.now()) {
  const attempts = (attemptsByClient.get(clientKey) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );
  if (attempts.length >= MAX_REQUESTS_PER_WINDOW) {
    attemptsByClient.set(clientKey, attempts);
    return true;
  }
  attempts.push(now);
  attemptsByClient.set(clientKey, attempts);
  return false;
}

export function hasCompletedContactSubmission(key: string, now = Date.now()) {
  const expiresAt = completedIdempotencyKeys.get(key);
  if (!expiresAt || expiresAt <= now) {
    completedIdempotencyKeys.delete(key);
    return false;
  }
  return true;
}

export function rememberContactSubmission(key: string, now = Date.now()) {
  completedIdempotencyKeys.set(key, now + IDEMPOTENCY_TTL_MS);
}

export function resetContactAbuseProtectionForTests() {
  attemptsByClient.clear();
  completedIdempotencyKeys.clear();
}
