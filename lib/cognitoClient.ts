"use client";

export const ACCESS_TOKEN_KEY = "access_token";
export const ID_TOKEN_KEY = "id_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const PKCE_VERIFIER_KEY = "pkce_verifier";
export const OAUTH_STATE_KEY = "oauth_state";
export const AUTH_CHANGED_EVENT = "personal-budget:auth-changed";

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

function setStorageValue(key: string, value?: string | null) {
  if (!inBrowser()) return;
  if (value) {
    window.sessionStorage.setItem(key, value);
    return;
  }
  window.sessionStorage.removeItem(key);
}

function dispatchAuthChanged() {
  if (!inBrowser()) return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
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

function randomString(length: number = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => (value % 36).toString(36))
    .join("")
    .slice(0, length);
}

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

  try {
    return {
      accessToken: window.sessionStorage.getItem(ACCESS_TOKEN_KEY),
      idToken: window.sessionStorage.getItem(ID_TOKEN_KEY),
      refreshToken: window.sessionStorage.getItem(REFRESH_TOKEN_KEY),
    };
  } catch {
    return { accessToken: null, idToken: null, refreshToken: null };
  }
}

export function isAuthenticated() {
  const { accessToken, idToken } = getStoredCognitoTokens();
  return Boolean(accessToken || idToken);
}

export function storeCognitoTokens(tokens: TokenResponseShape) {
  requireBrowser();
  setStorageValue(ACCESS_TOKEN_KEY, tokens.access_token ?? null);
  setStorageValue(ID_TOKEN_KEY, tokens.id_token ?? null);
  setStorageValue(REFRESH_TOKEN_KEY, tokens.refresh_token ?? null);
  dispatchAuthChanged();
}

export function clearPendingCognitoAuth() {
  if (!inBrowser()) return;
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
}

export function clearCognitoTokens() {
  if (!inBrowser()) return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ID_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  clearPendingCognitoAuth();
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
