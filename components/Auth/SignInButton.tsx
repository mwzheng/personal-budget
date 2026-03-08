// Note 1: SignInButton implements the OAuth 2.0 Authorization Code flow with
// PKCE (Proof Key for Code Exchange). PKCE was designed for public clients
// (like SPAs) that cannot safely store a client secret. Instead of a secret,
// the client generates a random `code_verifier`, derives a `code_challenge`
// from it via SHA-256, and sends the challenge with the authorization request.
// The verifier is stored locally and exchanged at the token endpoint later,
// preventing authorization code interception attacks.
"use client";
import React from "react";

// Note 2: `base64UrlEncode` converts raw bytes to Base64URL format (RFC 4648
// Section 5). Standard Base64 uses `+`, `/`, and `=` which are not URL-safe.
// Base64URL replaces `+` with `-`, `/` with `_`, and strips trailing `=` padding.
function base64UrlEncode(bytes: Uint8Array) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Note 3: `pkceChallengeFromVerifier` derives the PKCE `code_challenge` from
// a plaintext verifier string. The steps are:
//   1. Encode the verifier as UTF-8 bytes with `TextEncoder`.
//   2. Compute its SHA-256 digest using the Web Crypto API (`crypto.subtle`).
//   3. Base64URL-encode the raw digest bytes.
// This is the "S256" challenge method required by Cognito.
async function pkceChallengeFromVerifier(v: string) {
  const enc = new TextEncoder();
  const data = enc.encode(v);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

// Note 4: `randomString` generates a cryptographically random string of the
// requested length using `crypto.getRandomValues`, which is the browser's
// secure random number generator. Each byte is mapped to a base-36 character
// (0-9, a-z), giving a large enough character space for the PKCE verifier.
function randomString(length: number = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((n) => (n % 36).toString(36))
    .join("")
    .slice(0, length);
}

export default function SignInButton() {
  const onSignIn = async () => {
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const userPoolDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // e.g., https://your-domain.auth.us-east-1.amazoncognito.com (set in .env.local)
    const redirectUri = `${window.location.origin}/auth/callback`;
    if (!clientId || !userPoolDomain) {
      alert(
        "Cognito not configured. Set NEXT_PUBLIC_COGNITO_CLIENT_ID and NEXT_PUBLIC_COGNITO_DOMAIN in .env.local",
      );
      return;
    }
    // Note 5: The verifier is 96 characters of random Base36. The OAuth spec
    // recommends 43-128 characters. We use sessionStorage (not localStorage)
    // so the verifier is scoped to this browser tab and cleared when the tab
    // closes, reducing the window of exposure.
    const verifier = randomString(96);
    const challenge = await pkceChallengeFromVerifier(verifier);
    sessionStorage.setItem("pkce_verifier", verifier);
    // Note 6: The `state` parameter is a CSRF token. It is stored in
    // sessionStorage and verified in the callback page (`app/auth/callback`)
    // against the value Cognito echoes back. This prevents cross-site request
    // forgery attacks where a malicious site could trick the browser into
    // completing an authorization flow it did not initiate.
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem("oauth_state", state);
    const url = `${userPoolDomain}/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
      "openid profile email",
    )}&code_challenge_method=S256&code_challenge=${encodeURIComponent(challenge)}&state=${encodeURIComponent(
      state,
    )}`;
    window.location.href = url;
  };
  return (
    <button onClick={onSignIn} className="btn btn-primary">
      Sign in with Cognito
    </button>
  );
}
