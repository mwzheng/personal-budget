import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

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

const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(jwksUrl));

export async function verifyCognitoToken(token: string): Promise<JWTPayload> {
  if (!userPoolId || !clientId)
    throw new Error("Cognito configuration missing");
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    audience: clientId,
  });
  return payload as JWTPayload;
}

export async function getUserIdFromRequest(req: Request): Promise<string> {
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!auth) throw new Error("No Authorization header");
  const match = auth.match(/^Bearer (.+)$/i);
  if (!match) throw new Error("Invalid Authorization header");
  const token = match[1];
  const payload = await verifyCognitoToken(token);
  const sub = (payload && (payload as any).sub) || "";
  if (!sub) throw new Error("Token missing subject (sub) claim");
  return String(sub);
}
