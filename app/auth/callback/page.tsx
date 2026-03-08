"use client";
import React, { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const savedState = sessionStorage.getItem("oauth_state");
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
