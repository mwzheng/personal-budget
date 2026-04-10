"use client";

import { randomString } from "../utils/generateId";

export const ACCESS_TOKEN_KEY = "access_token";
export const ID_TOKEN_KEY = "id_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const PKCE_VERIFIER_KEY = "pkce_verifier";
export const OAUTH_STATE_KEY = "oauth_state";
export const AUTH_CHANGED_EVENT = "personal-budget:auth-changed";
export const DEMO_SESSION_KEY = "porridge-budget-demo-session";

export type CognitoFlowMode = "login" | "signup";

export interface StoredCognitoTokens {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
}

interface TokenResponseShape {
  access_token?: string | null;
  id_token?: string | null;
  refresh_token?: string | null;
}

function inBrowser() {
  return typeof window !== "undefined";
}

function requireBrowser() {
  if (!inBrowser()) {
    throw new Error("Cognito client helpers can only run in the browser.");
  }
}

function getStoredPersistentValue(key: string) {
  if (!inBrowser()) return null;

  try {
    const localValue = window.localStorage.getItem(key);
    if (localValue !== null) {
      return localValue;
    }
  } catch {
    // Ignore inaccessible storage and fall back to the legacy session copy.
  }

  try {
    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue !== null) {
      try {
        window.localStorage.setItem(key, sessionValue);
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore migration failures; the current session can still use it.
      }
      return sessionValue;
    }
  } catch {
    return null;
  }

  return null;
}

function setPersistentStorageValue(key: string, value?: string | null) {
  if (!inBrowser()) return;

  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore cleanup failures in the non-persistent fallback storage.
    }
    return;
  } catch {
    // Fall back to the current session when persistent storage is unavailable.
  }

  try {
    if (value) {
      window.sessionStorage.setItem(key, value);
    } else {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors; auth state is best effort in the browser.
  }
}

function dispatchAuthChanged() {
  if (!inBrowser()) return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function setDemoSessionValue(enabled: boolean) {
  if (!inBrowser()) return;

  if (enabled) {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, "true");
    return;
  }

  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
}

function clearStoredAuthStorage() {
  if (!inBrowser()) return;

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ID_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore inaccessible persistent storage during cleanup.
  }

  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(ID_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore inaccessible session storage during cleanup.
  }

  clearPendingCognitoAuth();
}

function base64UrlEncode(bytes: Uint8Array) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkceChallengeFromVerifier(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

// Note 2: `randomString` was extracted to `lib/utils/generateId.ts` so
// the PKCE / OAuth state generation logic is shared across the codebase.

export function normalizeCognitoDomain(domain?: string | null) {
  const trimmed = (domain || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getCognitoClientConfig() {
  return {
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
    domain: normalizeCognitoDomain(
      process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "",
    ),
  };
}

export function getAuthRedirectUri(origin?: string) {
  const resolvedOrigin =
    origin || (inBrowser() ? window.location.origin : undefined);
  return resolvedOrigin ? `${resolvedOrigin}/auth/callback` : "/auth/callback";
}

export function getLogoutRedirectUri(origin?: string) {
  const resolvedOrigin =
    origin || (inBrowser() ? window.location.origin : undefined);
  return resolvedOrigin ? `${resolvedOrigin}/auth/login` : "/auth/login";
}

export function getStoredCognitoTokens(): StoredCognitoTokens {
  if (!inBrowser()) {
    return { accessToken: null, idToken: null, refreshToken: null };
  }

  return {
    accessToken: getStoredPersistentValue(ACCESS_TOKEN_KEY),
    idToken: getStoredPersistentValue(ID_TOKEN_KEY),
    refreshToken: getStoredPersistentValue(REFRESH_TOKEN_KEY),
  };
}

// Note 1: Demo auth is intentionally tracked with a dedicated session flag rather
// than fake JWTs. That keeps client-side "signed in" state separate from real
// Cognito credentials, so browser-only demo sessions never reach the server as
// invalid Authorization headers.
export function isDemoSessionActive() {
  if (!inBrowser()) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function hasStoredCognitoTokens() {
  const { accessToken, idToken, refreshToken } = getStoredCognitoTokens();
  return Boolean(accessToken || idToken || refreshToken);
}

export function isAuthenticated() {
  return hasStoredCognitoTokens() || isDemoSessionActive();
}

export function storeCognitoTokens(tokens: TokenResponseShape) {
  requireBrowser();
  setPersistentStorageValue(ACCESS_TOKEN_KEY, tokens.access_token ?? null);
  setPersistentStorageValue(ID_TOKEN_KEY, tokens.id_token ?? null);
  setPersistentStorageValue(REFRESH_TOKEN_KEY, tokens.refresh_token ?? null);
  setDemoSessionValue(false);
  dispatchAuthChanged();
}

export async function startDemoSession() {
  requireBrowser();
  clearStoredAuthStorage();
  const { resetDemoStore } = await import("../demo/demoData");
  resetDemoStore();
  setDemoSessionValue(true);
  dispatchAuthChanged();
}

export function clearPendingCognitoAuth() {
  if (!inBrowser()) return;
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
}

export function clearCognitoTokens() {
  if (!inBrowser()) return;
  clearStoredAuthStorage();
  setDemoSessionValue(false);
  dispatchAuthChanged();
}

export async function startCognitoHostedAuth(mode: CognitoFlowMode = "login") {
  requireBrowser();
  const { clientId, domain } = getCognitoClientConfig();
  if (!clientId || !domain) {
    throw new Error(
      "Cognito is not configured. Set NEXT_PUBLIC_COGNITO_DOMAIN and NEXT_PUBLIC_COGNITO_CLIENT_ID.",
    );
  }

  const verifier = randomString(96);
  const challenge = await pkceChallengeFromVerifier(verifier);
  const state = randomString(32);
  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  window.sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getAuthRedirectUri(window.location.origin),
    scope: "openid profile email",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });

  const authPath = mode === "signup" ? "/signup" : "/oauth2/authorize";
  window.location.assign(`${domain}${authPath}?${params.toString()}`);
}

export function getCognitoLogoutUrl(origin?: string) {
  const { clientId, domain } = getCognitoClientConfig();
  if (!clientId || !domain) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: getLogoutRedirectUri(origin),
  });

  return `${domain}/logout?${params.toString()}`;
}

function parseTokenParams(raw: string) {
  const params = new URLSearchParams(raw);
  return {
    access_token: params.get("access_token"),
    id_token: params.get("id_token"),
    refresh_token: params.get("refresh_token"),
  };
}

export async function exchangeCognitoCodeForTokens(
  code: string,
  state?: string | null,
) {
  requireBrowser();

  if (!code) throw new Error("Missing authorization code from Cognito.");

  const expectedState = window.sessionStorage.getItem(OAUTH_STATE_KEY);
  if (!state || !expectedState || state !== expectedState) {
    clearPendingCognitoAuth();
    throw new Error("Invalid sign-in state. Start the sign-in flow again.");
  }

  const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) {
    clearPendingCognitoAuth();
    throw new Error("Missing PKCE verifier. Start the sign-in flow again.");
  }

  const { clientId, domain } = getCognitoClientConfig();
  if (!clientId || !domain) {
    clearPendingCognitoAuth();
    throw new Error(
      "Cognito is not configured. Set NEXT_PUBLIC_COGNITO_DOMAIN and NEXT_PUBLIC_COGNITO_CLIENT_ID.",
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    code_verifier: verifier,
    redirect_uri: getAuthRedirectUri(window.location.origin),
  });

  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json().catch(() => null)) as
    | (TokenResponseShape & {
        error?: string;
        error_description?: string;
      })
    | null;

  if (!response.ok) {
    clearPendingCognitoAuth();
    throw new Error(
      data?.error_description ||
        data?.error ||
        "Failed to exchange the Cognito authorization code.",
    );
  }

  storeCognitoTokens(data || {});
  clearPendingCognitoAuth();
}

export async function handleCognitoCallback() {
  requireBrowser();
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");
  if (error) {
    clearPendingCognitoAuth();
    throw new Error(searchParams.get("error_description") || error);
  }

  const code = searchParams.get("code");
  if (code) {
    await exchangeCognitoCodeForTokens(code, searchParams.get("state"));
    return;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) {
    clearPendingCognitoAuth();
    throw new Error("Missing sign-in response from Cognito.");
  }

  const tokens = parseTokenParams(hash);
  if (!tokens.access_token && !tokens.id_token) {
    clearPendingCognitoAuth();
    throw new Error("Missing tokens in the Cognito callback response.");
  }

  storeCognitoTokens(tokens);
  clearPendingCognitoAuth();
}
