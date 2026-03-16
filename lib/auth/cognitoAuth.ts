// Note 1: `jose` is a lightweight, standards-compliant JWT library for JavaScript
// runtimes including Node.js and Edge. It supports both RSA and ECDSA signing
// algorithms used by AWS Cognito (RS256 by default).
import { createRemoteJWKSet, jwtVerify } from "jose";

// Note 2: The `CognitoVerifyOptions` interface makes the function signatures
// self-documenting. Region defaults to us-east-1 to match most Cognito setups,
// but passing it explicitly is strongly recommended in multi-region apps.
export interface CognitoVerifyOptions {
  region?: string;
  userPoolId: string;
  audience?: string; // Cognito App Client ID
}

// Note 3: A module-level `Map` acts as an in-process cache for JWKS fetchers.
// Each fetcher is keyed by "region:userPoolId" so different user pools get
// separate caches. This avoids re-creating the fetcher (and re-fetching keys) on
// every request in a long-running Next.js server process.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksUrl(region: string, userPoolId: string) {
  // Note 4: AWS Cognito publishes RSA public keys at this well-known URL.
  // The `.well-known/jwks.json` path follows RFC 7517 (JSON Web Key Set).
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
}

function getJwks(region: string, userPoolId: string) {
  const key = `${region}:${userPoolId}`;
  // Note 5: Return the cached fetcher if one already exists for this pool.
  // The `!` non-null assertion is safe here because `has` was just checked.
  if (jwksCache.has(key)) return jwksCache.get(key)!;
  const url = jwksUrl(region, userPoolId);
  const jwks = createRemoteJWKSet(new URL(url));
  jwksCache.set(key, jwks);
  return jwks;
}

/**
 * Verifies a Cognito JWT (ID or access token) using the JWKS endpoint and returns the token payload.
 * Throws on verification failure.
 */
export async function verifyCognitoJwt(
  token: string,
  opts: CognitoVerifyOptions,
) {
  const { region = "us-east-1", userPoolId, audience } = opts;
  // Note 6: The `issuer` claim in the JWT must match this URL exactly.
  // Cognito uses this as the `iss` field; mismatches reject the token.
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const jwks = getJwks(region, userPoolId);

  // audience is optional; if provided, it's validated
  const verifyOptions: Record<string, unknown> = { issuer };
  if (audience)
    (verifyOptions as Record<string, unknown>)["audience"] = audience;

  // Note 7: `jwtVerify` performs three checks in one call:
  //   1. Signature verification using the matching public key from JWKS.
  //   2. `exp` (expiry) claim -- rejects tokens that have expired.
  //   3. `iss` and optionally `aud` claim validation (configured above).
  const { payload } = await jwtVerify(token, jwks, verifyOptions);
  return payload as Record<string, unknown>;
}

/**
 * Convenience helper for Next.js/Route Handler usage.
 * Returns the Cognito subject (sub) as userId or throws a 401 Response.
 */
export async function requireAuth(
  req: Request,
  opts: CognitoVerifyOptions,
): Promise<string> {
  const auth = req.headers.get("authorization") || "";
  // Note 8: Throwing a `Response` object from a Next.js Route Handler causes the
  // framework to send that exact HTTP response to the client. This pattern is
  // cleaner than passing error codes up a call stack in async API routes.
  if (!auth.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({
        error: {
          code: "unauthorized",
          message: "Missing Authorization header",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  // Note 9: `slice(7)` removes the "Bearer " prefix (7 characters including the
  // trailing space) to isolate the raw token string.
  const token = auth.slice(7).trim();
  try {
    const payload = (await verifyCognitoJwt(token, opts)) as Record<
      string,
      unknown
    >;
    // Note 10: The `sub` claim is Cognito's stable, immutable user identifier.
    // It remains the same even if the user changes their email or username.
    const userId = (payload as Record<string, unknown>)["sub"] as
      | string
      | undefined;
    if (!userId) throw new Error("Token missing sub claim");
    return userId;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Cognito token verification failed", err);
    throw new Response(
      JSON.stringify({
        error: { code: "unauthorized", message: "Invalid token" },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
