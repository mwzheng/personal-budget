// Note 1: This module centralizes how API routes resolve the "current user".
// Keeping the rules in one file avoids subtle drift where some routes require a
// Cognito token while others silently fall back to demo behavior.
import { getPayloadFromRequest as getPayloadFromJwt } from "./auth";

export const DEMO_USER_ID = "local-demo";

// Note 2: Demo mode is only enabled when `DISABLE_AUTH=true` is set explicitly.
// Missing Cognito configuration is treated as an error rather than an implicit
// opt-in to shared demo data, because signed-in users must never see each
// other's records through a silent fallback.
export function isAuthBypassedForDemo(): boolean {
  return process.env.DISABLE_AUTH === "true";
}

export async function getRequestUserPayload(
  req: Request,
): Promise<Record<string, unknown>> {
  if (isAuthBypassedForDemo()) {
    return { sub: DEMO_USER_ID, email: "local-demo@example.com" };
  }

  try {
    return await getPayloadFromJwt(req);
  } catch (error) {
    throw new Response(
      JSON.stringify({
        error: {
          code: "unauthorized",
          message:
            error instanceof Error
              ? error.message
              : "Invalid Authorization header",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export function getUserIdFromPayload(payload: Record<string, unknown>): string {
  const sub = payload.sub;

  if (typeof sub !== "string" || !sub) {
    throw new Error("Token missing subject (sub) claim");
  }

  return sub;
}

export async function getRequestUserId(req: Request): Promise<string> {
  const payload = await getRequestUserPayload(req);
  return getUserIdFromPayload(payload);
}

export function isDemoUserId(userId: string): boolean {
  return userId === DEMO_USER_ID;
}
