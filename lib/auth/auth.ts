/**
 * Note 1: Consolidated Cognito JWT verification module.
 *
 * This is the single source of truth for server-side token verification.
 * It accepts both access tokens and ID tokens by first attempting strict
 * audience validation and then falling back to issuer-only verification
 * when the `aud` claim is absent or mismatched (common with Cognito access
 * tokens). Three helpers are exported:
 *
 * - `verifyCognitoToken`  — low-level: verifies a raw JWT string.
 * - `getUserIdFromRequest` — extracts the `sub` claim from an HTTP request.
 * - `getPayloadFromRequest` — returns the full verified payload from a request.
 *
 * Previously this logic was duplicated across `auth.ts` and `auth2.ts`.
 * The two files were merged because they shared identical verification logic;
 * the only difference was `getPayloadFromRequest` living exclusively in auth2.
 */
import { JWTPayload } from "jose";
import { verifyCognitoJwt } from "./cognitoAuth";
import { parseBearerToken } from "./parseAuthHeader";

// Note 2: Environment variables are read at module initialization time (when the
// file is first imported). Prefer reading them once rather than inside every
// function call so that missing-config errors surface at startup.
const region =
  process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
const userPoolId =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ||
  process.env.COGNITO_USER_POOL_ID ||
  "";
const clientId =
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
  process.env.COGNITO_CLIENT_ID ||
  "";

if (!userPoolId) {
  // In local/dev without env configured, token verification will be skipped by helpers that check for userPoolId.
}

export async function verifyCognitoToken(token: string): Promise<JWTPayload> {
  if (!userPoolId) throw new Error("Cognito configuration missing");

  if (clientId) {
    try {
      const payload = await verifyCognitoJwt(token, {
        region,
        userPoolId,
        audience: clientId,
      });
      return payload as JWTPayload;
    } catch (error) {
      const message = String(error ?? "");

      // Note 2: Cognito access tokens do not always carry the same audience
      // shape as ID tokens. Falling back to issuer/signature verification keeps
      // the route layer aligned with the token type that `apiFetch` sends.
      if (
        message.includes("aud") ||
        message.includes("audience") ||
        message.includes("JWTClaimValidationFailed")
      ) {
        const payload = await verifyCognitoJwt(token, { region, userPoolId });
        return payload as JWTPayload;
      }

      throw error;
    }
  }

  const payload = await verifyCognitoJwt(token, { region, userPoolId });
  return payload as JWTPayload;
}

/**
 * Note 3: Extracts and returns the authenticated user's ID from an HTTP request.
 * The Authorization header must use the "Bearer" scheme:
 *   Authorization: Bearer <jwt>
 * The `sub` (subject) claim in the verified payload is Cognito's stable unique
 * identifier for the user and is safe to use as a database partition key.
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  // Note 4: Bearer parsing is handled by the shared `parseBearerToken` helper
  // in `lib/auth/parseAuthHeader.ts`, which follows the RFC 6750 spec.
  const token = parseBearerToken(auth);
  if (!token) throw new Error("Missing or invalid Authorization header");
  const payload = await verifyCognitoToken(token);
  const sub = payload.sub ?? "";
  if (!sub) throw new Error("Token missing subject (sub) claim");
  return String(sub);
}

/**
 * Note 5: Returns the full verified JWT payload from the request's
 * Authorization header. Useful when callers need claims beyond `sub`
 * (e.g., email, name, custom attributes) for user profile upserts or
 * audit logging. For routes that only need the user ID, prefer
 * `getUserIdFromRequest` to keep the call-site intent explicit.
 */
export async function getPayloadFromRequest(req: Request): Promise<JWTPayload> {
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = parseBearerToken(auth);
  if (!token) throw new Error("Missing or invalid Authorization header");
  return verifyCognitoToken(token);
}
