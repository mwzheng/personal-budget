// Note 1: `createRemoteJWKSet` from the `jose` library fetches and caches the
// public keys published by AWS Cognito at its JWKS endpoint. These keys are used
// to verify the cryptographic signature of every incoming JWT token without
// storing any secrets server-side -- the public key is, by definition, public.
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

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

// Note 3: Cognito publishes its public signing keys at a well-known JWKS URL.
// `createRemoteJWKSet` returns a lazy key-fetcher that automatically refreshes
// when it encounters an unknown `kid` (key ID) in a token header -- this handles
// key rotation transparently.
const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(jwksUrl));

/**
 * Note 4: Verifies a raw JWT string against Cognito's public keys.
 * `jwtVerify` checks the signature, expiry (`exp`), issuer (`iss`), and
 * audience (`aud`) claims -- all four checks must pass for the token to be valid.
 * Throws a `JWTExpired` or `JWSSignatureVerificationFailed` error on failure.
 */
export async function verifyCognitoToken(token: string): Promise<JWTPayload> {
  if (!userPoolId || !clientId)
    throw new Error("Cognito configuration missing");
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    audience: clientId,
  });
  return payload as JWTPayload;
}

/**
 * Note 5: Extracts and returns the authenticated user's ID from an HTTP request.
 * The Authorization header must use the "Bearer" scheme:
 *   Authorization: Bearer <jwt>
 * The `sub` (subject) claim in the verified payload is Cognito's stable unique
 * identifier for the user and is safe to use as a database partition key.
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!auth) throw new Error("No Authorization header");
  // Note 6: The regex `^Bearer (.+)$` captures everything after "Bearer " into
  // group 1. The `i` flag makes the match case-insensitive so both "Bearer" and
  // "bearer" are accepted, following the RFC 6750 spec.
  const match = auth.match(/^Bearer (.+)$/i);
  if (!match) throw new Error("Invalid Authorization header");
  const token = match[1];
  const payload = await verifyCognitoToken(token);
  const sub = (payload && (payload as any).sub) || "";
  if (!sub) throw new Error("Token missing subject (sub) claim");
  return String(sub);
}
