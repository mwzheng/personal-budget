import { createRemoteJWKSet, jwtVerify } from "jose";

export interface CognitoVerifyOptions {
  region?: string;
  userPoolId: string;
  audience?: string; // Cognito App Client ID
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksUrl(region: string, userPoolId: string) {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
}

function getJwks(region: string, userPoolId: string) {
  const key = `${region}:${userPoolId}`;
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
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const jwks = getJwks(region, userPoolId);

  // audience is optional; if provided, it's validated
  const verifyOptions: Record<string, unknown> = { issuer };
  if (audience)
    (verifyOptions as Record<string, unknown>)["audience"] = audience;

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
  const token = auth.slice(7).trim();
  try {
    const payload = (await verifyCognitoJwt(token, opts)) as Record<
      string,
      unknown
    >;
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
