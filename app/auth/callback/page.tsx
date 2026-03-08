// Note 1: This page handles the OAuth 2.0 Authorization Code flow with PKCE
// (Proof Key for Code Exchange). After the user authenticates in Cognito's hosted
// UI, Cognito redirects here with a short-lived authorization `code` in the URL.
// This page exchanges that code for tokens and then redirects to the home page.
"use client";
import React, { useEffect } from "react";

export default function AuthCallbackPage() {
  // Note 2: `useEffect` with an empty dependency array runs once after the
  // component first mounts. This is the correct place to run the code exchange
  // because it needs access to `window.location` and `sessionStorage`, which are
  // only available in the browser (not during server-side rendering).
  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      // Note 3: The `state` parameter is an anti-CSRF (Cross-Site Request
      // Forgery) token. Before starting the login flow, a random `state` value
      // was stored in sessionStorage. We verify it matches here to ensure the
      // callback originated from our own login page and not a malicious redirect.
      const state = params.get("state");
      const savedState = sessionStorage.getItem("oauth_state");
      // Note 4: The PKCE `code_verifier` is a random high-entropy string generated
      // before the login redirect and stored in sessionStorage. Sending it in the
      // token exchange proves that the party exchanging the code is the same party
      // that initiated the login -- preventing authorization code interception attacks.
      const verifier = sessionStorage.getItem("pkce_verifier");
      if (!code) {
        console.error("No code in callback");
        return;
      }
      if (state !== savedState) {
        console.error("OAuth state mismatch");
        return;
      }
      // Exchange code for tokens
      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback`;
      if (!domain || !clientId || !verifier) {
        console.error("Cognito not configured or missing PKCE verifier");
        return;
      }
      const tokenUrl = `${domain}/oauth2/token`;
      // Note 5: The token endpoint requires `application/x-www-form-urlencoded`
      // encoding (not JSON). URLSearchParams automatically formats the body in
      // the correct key=value&key2=value2 format.
      const body = new URLSearchParams();
      body.set("grant_type", "authorization_code");
      body.set("client_id", clientId);
      body.set("code", code);
      body.set("redirect_uri", redirectUri);
      body.set("code_verifier", verifier);

      try {
        const res = await fetch(tokenUrl, {
          method: "POST",
          body,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Token exchange failed", data);
          return;
        }
        // Store tokens in sessionStorage (short lived) and redirect to home
        // Note 6: `sessionStorage` is used instead of `localStorage` so tokens
        // are automatically cleared when the browser tab is closed. This limits
        // the window of exposure if a user forgets to sign out on a shared computer.
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("id_token", data.id_token);
        sessionStorage.setItem("refresh_token", data.refresh_token || "");
        window.location.href = "/";
      } catch (err) {
        console.error("Token exchange error", err);
      }
    }
    handle();
  }, []);

  return <div>Signing in...</div>;
}
