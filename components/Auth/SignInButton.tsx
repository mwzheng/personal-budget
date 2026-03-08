"use client";
import React from "react";

function base64UrlEncode(bytes: Uint8Array) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkceChallengeFromVerifier(v: string) {
  const enc = new TextEncoder();
  const data = enc.encode(v);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

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
    const verifier = randomString(96);
    const challenge = await pkceChallengeFromVerifier(verifier);
    sessionStorage.setItem("pkce_verifier", verifier);
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
