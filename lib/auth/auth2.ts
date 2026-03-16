// Note: auth2 provides robust token verification with a fallback when the token
// does not include an `aud` claim. This mirrors production behavior where some
// Cognito tokens (e.g., ID tokens vs access tokens) may omit `aud`.
import { JWTPayload } from "jose";
import { verifyCognitoJwt } from "./cognitoAuth";

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

export async function verifyCognitoToken(token: string): Promise<JWTPayload> {
  if (!userPoolId) throw new Error("Cognito configuration missing");

  // Try strict verification (with audience) first if a clientId is configured.
  if (clientId) {
    try {
      const payload = await verifyCognitoJwt(token, {
        region,
        userPoolId,
        audience: clientId,
      });
      return payload as JWTPayload;
    } catch (err: any) {
      const msg = String(err || "");
      // If failure appears to be caused by a missing/invalid `aud` claim,
      // fall back to verifying without audience. This allows the app to accept
      // ID tokens that do not contain `aud` while still validating signature
      // and issuer.
      if (
        msg.includes("aud") ||
        msg.includes("audience") ||
        msg.includes("JWTClaimValidationFailed")
      ) {
        const payload = await verifyCognitoJwt(token, { region, userPoolId });
        return payload as JWTPayload;
      }
      throw err;
    }
  }

  // No clientId configured; verify without audience.
  const payload = await verifyCognitoJwt(token, { region, userPoolId });
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

export async function getPayloadFromRequest(
  req: Request,
): Promise<Record<string, unknown>> {
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!auth) throw new Error("No Authorization header");
  const match = auth.match(/^Bearer (.+)$/i);
  if (!match) throw new Error("Invalid Authorization header");
  const token = match[1];
  const payload = await verifyCognitoToken(token);
  return payload as Record<string, unknown>;
}
