"use client";

import { getStoredCognitoTokens, isDemoSessionActive } from "./cognitoClient";

export function currentTransactionScope() {
  if (isDemoSessionActive()) return "demo";
  const { accessToken, idToken } = getStoredCognitoTokens();
  const token = accessToken || idToken;
  if (token) {
    try {
      const payload = token.split(".")[1];
      if (payload) {
        const claims = JSON.parse(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
        ) as { sub?: unknown };
        if (typeof claims.sub === "string" && claims.sub) {
          return `user:${claims.sub}`;
        }
      }
    } catch {
      // Keep malformed or non-JWT credentials isolated by their token below.
    }
    // Keep non-JWT or malformed credentials isolated as well. Reusing one
    // generic scope could expose a previous user's cached transactions if an
    // auth-change event is missed or the provider returns a non-JWT token.
    return `authenticated:${token}`;
  }
  return process.env.NEXT_PUBLIC_DISABLE_AUTH === "true"
    ? "disabled-auth"
    : null;
}
