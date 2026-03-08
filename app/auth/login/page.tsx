"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function LoginPage() {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "";
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
  const redirectUri =
    typeof window !== "undefined"
      ? window.location.origin + "/auth/callback"
      : "/auth/callback";

  const signInHosted = () => {
    if (!domain || !clientId)
      return alert(
        "Hosted Cognito not configured (NEXT_PUBLIC_COGNITO_DOMAIN/NEXT_PUBLIC_COGNITO_CLIENT_ID)",
      );
    const url = `${domain}/login?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("openid profile email")}`;
    window.location.href = url;
  };

  const demoSignIn = () => {
    // Development-only convenience: set a dummy token to simulate login.
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("access_token", "demo-access-token");
      window.sessionStorage.setItem("id_token", "demo-id-token");
      window.sessionStorage.setItem("refresh_token", "demo-refresh-token");
    }
    router.push("/reports");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Sign in</h1>
      <p>
        If you have an account, sign in using the hosted Cognito UI
        (recommended) or use the demo sign-in for local development.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={signInHosted} style={{ padding: "8px 12px" }}>
          Sign in with Cognito
        </button>
        <button onClick={demoSignIn} style={{ padding: "8px 12px" }}>
          Demo sign in
        </button>
      </div>
    </div>
  );
}
